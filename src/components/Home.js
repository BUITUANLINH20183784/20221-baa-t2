import { ethers } from "ethers";
import { useEffect, useState } from "react";

import close from "../assets/close.svg";

const Home = ({ home, provider, account, escrow, togglePop }) => {
  const [hasBought, setHasBought] = useState(false);
  const [hasLended, setHasLended] = useState(false);
  const [hasInspected, setHasInspected] = useState(false);
  const [hasSold, setHasSold] = useState(false);

  const [buyer, setBuyer] = useState(null);
  const [lender, setLender] = useState(null);
  const [inspector, setInspector] = useState(null);
  const [seller, setSeller] = useState(null);

  const [owner, setOwner] = useState(null);
  const [property, setProperty] = useState({});

  const [contactShown, setContactShown] = useState(false);
  const [newInspector, setNewInspector] = useState("");
  const [newLender, setNewLender] = useState("");

  const addressPattern = "^0x[a-fA-F0-9]{40}$"
  const addressRegex = RegExp(addressPattern)
  const zeroAddress = "0x0000000000000000000000000000000000000000"

  const fetchDetails = async () => {
    const property = await escrow.properties(home.id);
    setProperty(property);
    const {
      seller,
      buyer,
      inspector,
      lender,
      purchasePrice,
      escrowAmount,
      isInspected,
      lenderApproved,
      state,
      paidAmount,
      lentAmount,
    } = property;
    switch (state) {
      case 0:
        setBuyer(null)
        setInspector(null)
        setNewInspector("")
        setLender(null)
        setNewLender("")
        setHasInspected(false);
        setHasLended(false);
        break;
      case 1:
      case 2:
        // console.log("case 1 & 2")
        setBuyer(buyer)
        setInspector(inspector)
        setNewInspector(inspector)
        setLender(lender)
        setNewLender(lender)
        setHasInspected(isInspected);
        setHasLended(lenderApproved);
        break;
      case 2:
        // console.log("case 2")
        break;
        
      default:
        break;
    }

    // -- Buyer

    // setBuyer(buyer);
    setHasBought(state === 2);

    // -- Seller

    setSeller(seller);
    setHasSold(state === 2);

    // -- Lender

    // if (state === 1) {
    //   setLender(lender);
    //   setNewLender(lender)
    // }
    // setHasLended(lenderApproved);

    // -- Inspector

    // if (state === 1) {
    //   setInspector(inspector);
    //   setNewInspector(inspector)
    // }
    // setHasInspected(isInspected);

    if (property.state === 2) {
      setOwner(property.buyer);
    }
  };

  const buyHandler = async () => {
    if (!addressRegex.test(newInspector) || !addressRegex.test(newLender)) {
      setContactShown(true);
      return
    }

    const escrowAmount = property.escrowAmount
    const signer = await provider.getSigner();

    // Buyer deposit earnest
    let transaction = await escrow.connect(signer).depositEarnest(home.id, newInspector, newLender, {
      value: escrowAmount,
    });
    await transaction.wait();

    // Buyer approves...
    // transaction = await escrow.connect(signer).approveSale(home.id);
    // await transaction.wait();

    setHasBought(true);
    setProperty({...property, state: 1})
    fetchDetails();
  };

  const inspectHandler = async () => {
    if (account !== inspector || hasInspected === true) {
      return
    }

    const signer = await provider.getSigner();

    // Inspector updates status
    const transaction = await escrow.connect(signer).updateInspectionStatus(
      home.id,
      true,
    );
    await transaction.wait();

    setHasInspected(true);
  };

  const lendHandler = async () => {
    const signer = await provider.getSigner();

    // Lender approves...
    const lendAmount = Math.max(property.purchasePrice - property.paidAmount - property.lentAmount, 0);
    // console.log({lendAmount})
    const transaction = await escrow.connect(signer).approveSale(home.id, {
      value: lendAmount.toString(), // because lendAmount is not BigNum string, after calculation
    });
    await transaction.wait();

    // Lender sends funds to contract...
    // await signer.sendTransaction({
    //   to: escrow.address,
    //   value: lendAmount.toString(),
    //   gasLimit: 60000,
    // });

    setHasLended(true);
    fetchDetails();
  };

  const sellHandler = async () => {
    const signer = await provider.getSigner();

    // Seller approves...
    // let transaction = await escrow.connect(signer).approveSale(home.id);
    // await transaction.wait();

    // Seller finalize...
    const transaction = await escrow.connect(signer).finalizeSale(home.id);
    await transaction.wait();

    setHasSold(true);
    setProperty({...property, state: 2})
    fetchDetails();
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  return (
    <div className="home">
      <div className="home__details">
        <div className="home__image">
          <img src={home.image} alt="Home" />
        </div>
        <div className="home__overview">
          <h1>{home.name}</h1>
          <p>
            <strong>{home.attributes[2].value}</strong> bds |
            <strong>{home.attributes[3].value}</strong> ba |
            <strong>{home.attributes[4].value}</strong> sqft
          </p>
          <p>{home.address}</p>

          <h2>{home.attributes[0].value} ETH</h2>

          {owner
            ? (
              <div className="home__owned">
                Owned by {owner.slice(0, 6) + "..." + owner.slice(38, 42)}
              </div>
            )
            : (
              <div>
                {(account === inspector)
                  ? (
                    <button
                      className="home__buy"
                      onClick={inspectHandler}
                      disabled={hasInspected}
                    >
                      Approve Inspection
                    </button>
                  ) : null}
                { (account === lender)
                  ? (
                    <button
                      className="home__buy"
                      onClick={lendHandler}
                      disabled={hasLended && (property.purchasePrice - property.paidAmount - property.lentAmount <= 0)}
                    >
                        Approve & Lend {ethers.utils.formatEther(Math.max(property.purchasePrice - property.paidAmount - property.lentAmount, 0).toString())} ETH
                    </button>
                  ) : null}
                { (account === seller)
                  ? (
                    <button
                      className="home__buy"
                      onClick={sellHandler}
                      disabled={!(property.state === 1 &&
                        property.isInspected && property.lenderApproved)}
                    >
                      Approve & Sell
                    </button>
                  ) : null}
                { (account === buyer)
                  ? (
                    <button
                      className="home__buy"
                      disabled
                    >
                      Cancel
                    </button>
                  ) : null}
                {(account !== buyer && account !== seller && account !== inspector && account !== lender)? (
                    <button
                      className="home__buy"
                      onClick={buyHandler}
                      disabled={!(property.state === 0)}
                    >
                      Buy {property.state === 0 ? `(${ethers.utils.formatEther(property.escrowAmount)} ETH)` : ""}
                    </button>
                  ):null}

                <button
                  className="home__contact"
                  onClick={() => setContactShown(!contactShown)}
                >
                  Contact agent
                </button>
              </div>
            )}
          {!contactShown ? null : (
            <div className="sell__mult">
              <div className="sell__field">
                <label>Inspector</label>
                <input
                  type="text"
                  value={newInspector}
                  onChange={(e) => setNewInspector(e.target.value)}
                  pattern={addressPattern}
                  required
                >
                </input>
              </div>
              <div className="sell__field">
                <label>Lender</label>
                <input
                  type="text"
                  value={newLender}
                  onChange={(e) => setNewLender(e.target.value)}
                  pattern={addressPattern}
                  required
                >
                </input>
              </div>
            </div>
          )}

          <hr />

          <h2>Overview</h2>

          <p>
            {home.description}
          </p>

          <hr />

          <h2>Facts and features</h2>

          <ul>
            {home.attributes.map((attribute, index) => (
              <li key={index}>
                <strong>{attribute.trait_type}</strong> : {attribute.value}
              </li>
            ))}
          </ul>
        </div>

        <button onClick={togglePop} className="home__close">
          <img src={close} alt="Close" />
        </button>
      </div>
    </div>
  );
};

export default Home;
