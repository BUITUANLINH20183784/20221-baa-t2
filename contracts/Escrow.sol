//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    address public nftAddress;

    enum State {
        OnSale,
        Pending,
        Sold
    }

    struct Property {
        address payable seller;
        address payable buyer;
        address inspector;
        address lender;
        uint256 purchasePrice;
        uint256 escrowAmount;
        bool isInspected;
        bool lenderApproved;
        State state;
        uint256 paidAmount;
        uint256 lentAmount;
    }

    mapping(uint256 => Property) public properties;

    constructor(
        address _nftAddress
    ) {
        nftAddress = _nftAddress;
    }

    function list(
        uint256 _nftID,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) public payable {
        // Transfer NFT from seller to this contract
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        properties[_nftID].seller = payable(msg.sender);
        properties[_nftID].purchasePrice = _purchasePrice;
        properties[_nftID].escrowAmount = _escrowAmount;
        properties[_nftID].state = State.OnSale;
    }

    // Put Under Contract (only buyer - payable escrow)
    function depositEarnest(uint256 _nftID, address _inspector, address _lender) public payable {
        require(properties[_nftID].state == State.OnSale, "Not on sale");
        require(msg.value >= properties[_nftID].escrowAmount, "Not enough escrow amount");

        properties[_nftID].buyer = payable(msg.sender);
        properties[_nftID].inspector = _inspector;
        properties[_nftID].lender = _lender;
        properties[_nftID].isInspected = false;
        properties[_nftID].lenderApproved = false;
        properties[_nftID].state = State.Pending;
        properties[_nftID].paidAmount = msg.value;
        properties[_nftID].lentAmount = 0;
    }

    // Update Inspection Status (only inspector)
    function updateInspectionStatus(uint256 _nftID, bool _passed)
        public
    {
        require(properties[_nftID].state == State.Pending, "Not in pending");
        require(properties[_nftID].inspector == msg.sender, "Only authorized inspector can call this method");
        properties[_nftID].isInspected = _passed;
    }

    // Approve Sale
    function approveSale(uint256 _nftID) public payable {
        require(properties[_nftID].state == State.Pending, "Not in pending");
        require(properties[_nftID].lender == msg.sender, "Only authorized lender can call this method");
        properties[_nftID].lenderApproved = true;
        properties[_nftID].lentAmount += msg.value;
    }

    // Finalize Sale
    // -> Require inspection status (add more items here, like appraisal)
    // -> Require sale to be authorized
    // -> Require funds to be correct amount
    // -> Transfer NFT to buyer
    // -> Transfer Funds to Seller
    function finalizeSale(uint256 _nftID) public {
        require(properties[_nftID].state == State.Pending, "Not in pending");
        require(properties[_nftID].seller == payable(msg.sender), "Only authorized seller can call this method");
        require(properties[_nftID].isInspected, "Not inspected");
        require(properties[_nftID].lenderApproved, "Not approved");
        require(address(this).balance >= properties[_nftID].purchasePrice, "Not enough balance");
        uint256 totalAmount = properties[_nftID].paidAmount + properties[_nftID].lentAmount;
        require(totalAmount >= properties[_nftID].purchasePrice, "Not enough amount");

        (bool success, ) = payable(properties[_nftID].seller).call{value: totalAmount}(
            ""
        );
        require(success, "Cannot pay seller");

        IERC721(nftAddress).transferFrom(address(this), properties[_nftID].buyer, _nftID);

        properties[_nftID].state = State.Sold;
    }

    // Cancel Sale (handle earnest deposit)
    // -> if inspection status is not approved, then refund, otherwise send to seller
    function cancelSale(uint256 _nftID) public {
        require(properties[_nftID].state == State.Pending, "Not in pending");
        require(properties[_nftID].buyer == payable(msg.sender) || properties[_nftID].seller == payable(msg.sender), "Only authorized seller or buyer can call this method");
        uint256 totalAmount = properties[_nftID].paidAmount + properties[_nftID].lentAmount;
        if (properties[_nftID].isInspected == false) {
            payable(properties[_nftID].buyer).transfer(properties[_nftID].paidAmount);
            if (properties[_nftID].lenderApproved) {
                payable(properties[_nftID].lender).transfer(properties[_nftID].lentAmount);
            }
        } else {
            payable(properties[_nftID].seller).transfer(totalAmount);
        }
        properties[_nftID].state = State.OnSale;
    }

    receive() external payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
