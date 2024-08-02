// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract EGG is ERC20, ERC20Permit {
    constructor()
        ERC20("EGG", "EGG")
      
        ERC20Permit("EGG")
    {}
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

}
