// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Loancontract {
    enum State {
        PENDING,
        ACTIVE,
        CLOSED
    }

    State public state = State.PENDING;
    uint256 public amount;
    uint256 public interest;
    uint256 public end;
    address payable public borrower;
    address payable public lender;

    modifier lenderPermit() {
        require(msg.sender == lender, "Only lender have permit");
        _;
    }

    modifier borrowerPermit() {
        require(msg.sender == borrower, "Only borrower have permit");
        _;
    }

    modifier insuffient(uint256 amounts) {
        require(msg.value == amounts, "Amount must be exact");
        _;
    }

    modifier isMatured() {
        require(end < block.timestamp, "Loan has not matured yet");
        _;
    }

    constructor(
        uint256 _amount,
        uint256 _interest,
        uint256 _duration,
        address payable _borrower,
        address payable _lender
    ) {
        amount = _amount;
        interest = _interest;
        end = _duration; // duration in seconds
        borrower = _borrower;
        lender = _lender;
    }

    function makefund() public payable lenderPermit insuffient(amount) {
        _transition();
        borrower.transfer(amount);
        end = block.timestamp + (end * 60); // 60 seconds for each minute // add 86400 for 1 day
    } // fund the contract by lender and send fund to borrower

    function rembuirse()
        public
        payable
        borrowerPermit
        isMatured
        insuffient(amount + interest)
    {
        _transition();
        uint256 amountWithInterest = amount + interest;
        lender.transfer(amountWithInterest);
    } //Remburise the amount from the borrower with interest

    function _transition() internal {
        if (msg.sender == lender) {
            require(state == State.PENDING, "Already Funded");
            state = State.ACTIVE;
        }
        if (msg.sender == borrower) {
            require(state != State.PENDING, "Loan is not active");
            require(state == State.ACTIVE, "Already Closed");
            state = State.CLOSED;
        }
    } // internal function to move the loan state from pending to active and en
}
