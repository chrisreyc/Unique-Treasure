// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, ebool, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title UniqueTreasure
 * @notice A trustless treasure hunt game powered by FHE
 * @dev User picks 1-4, contract generates random 1-4, compare encrypted
 */
contract UniqueTreasure is ZamaEthereumConfig {
    // Encrypted result per player (0 = lose, 1 = win)
    mapping(address => euint8) private results;
    
    // Track if player has an active game
    mapping(address => bool) public hasPlayed;

    event GamePlayed(address indexed player);
    event ResultReady(address indexed player);

    /**
     * @notice Play the treasure game
     * @param encryptedChoice User's encrypted choice (1-4)
     * @param inputProof Proof for the encrypted input
     */
    function play(
        externalEuint8 encryptedChoice,
        bytes calldata inputProof
    ) external {
        require(!hasPlayed[msg.sender], "Already played");
        
        // Convert external encrypted input
        euint8 userChoice = FHE.fromExternal(encryptedChoice, inputProof);
        FHE.allowThis(userChoice);

        // Generate random number 1-4 for treasure position
        // Use bitwise AND with 3 (binary 11) to get 0-3, then add 1
        euint8 rand = FHE.randEuint8();
        euint8 masked = FHE.and(rand, FHE.asEuint8(3)); // 0-3
        euint8 treasurePosition = FHE.add(masked, FHE.asEuint8(1)); // 1-4
        FHE.allowThis(treasurePosition);

        // Compare: if equal, player wins (result = 1), else loses (result = 0)
        ebool isMatch = FHE.eq(userChoice, treasurePosition);
        euint8 result = FHE.select(isMatch, FHE.asEuint8(1), FHE.asEuint8(0));
        
        // Store result and authorize
        FHE.allowThis(result);
        FHE.allow(result, msg.sender); // Critical: allow user to decrypt

        results[msg.sender] = result;
        hasPlayed[msg.sender] = true;

        emit GamePlayed(msg.sender);
        emit ResultReady(msg.sender);
    }

    /**
     * @notice Get encrypted result handle for decryption
     * @param player The player's address
     * @return The encrypted result handle (0 or 1)
     */
    function getResult(address player) external view returns (euint8) {
        return results[player];
    }

    /**
     * @notice Reset player state (allow replay)
     * @dev Clears hasPlayed flag. Encrypted result will be overwritten on next play.
     */
    function resetGame() external {
        hasPlayed[msg.sender] = false;
        // Note: Cannot delete euint8 or set to zero without FHE operations
        // Result will be overwritten on next play() call
    }
}

