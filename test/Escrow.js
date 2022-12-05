const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let buyer, seller, inspector, lender
    let realEstate, escrow

    beforeEach(async () => {
        // Setup accounts
        [_, seller, buyer, inspector, lender] = await ethers.getSigners()

        // Deploy Real Estate
        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()

        // Mint 
        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS")
        await transaction.wait()

        // Deploy Escrow
        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(
            realEstate.address,
        )

        // Approve Property
        transaction = await realEstate.connect(seller).approve(escrow.address, 1)
        await transaction.wait()

        // List Property
        transaction = await escrow.connect(seller).list(1, tokens(10), tokens(5))
        await transaction.wait()
    })

    describe('Deployment', () => {
        it('Returns NFT address', async () => {
            const result = await escrow.nftAddress()
            expect(result).to.be.equal(realEstate.address)
        })
    })

    describe('Deposits', () => {
        beforeEach(async () => {
            const transaction = await escrow.connect(buyer).depositEarnest(1, inspector.address, lender.address, { value: tokens(10) })
            await transaction.wait()
        })

        it('Updates contract balance', async () => {
            const result = await escrow.getBalance()
            expect(result).to.be.equal(tokens(10))
        })

        it('Sets inspector', async () => {
            const result = await escrow.properties(1)
            expect(result.inspector).to.be.equal(inspector.address)
        })

        it('Sets lender', async () => {
            const result = await escrow.properties(1)
            expect(result.lender).to.be.equal(lender.address)
        })

        describe('Inspection', () => {
            beforeEach(async () => {
                const transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
                await transaction.wait()
            })

            it('Updates inspection status', async () => {
                const result = await escrow.properties(1)
                expect(result.isInspected).to.be.equal(true)
            })
        })

        describe('Approval', () => {
            beforeEach(async () => {
                transaction = await escrow.connect(lender).approveSale(1)
                await transaction.wait()
            })

            it('Updates approval status', async () => {
                const result = await escrow.properties(1)
                expect(result.lenderApproved).to.be.equal(true)
            })
        })
    })

    describe('Sale', () => {
        beforeEach(async () => {
            let transaction = await escrow.connect(buyer).depositEarnest(1, inspector.address, lender.address, { value: tokens(10) })
            await transaction.wait()

            transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()

            transaction = await escrow.connect(lender).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(seller).finalizeSale(1)
            await transaction.wait()
        })

        it('Updates ownership', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address)
        })

        it('Updates state', async () => {
            const result = await escrow.properties(1)
            expect(result.state).to.be.equal(2)
        })
    })
})
