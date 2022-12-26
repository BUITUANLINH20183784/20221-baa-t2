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
      pendingAmount,
    } = property;

    // -- Buyer

    setBuyer(buyer);
    setHasBought(state === 2);

    // -- Seller

    setSeller(seller);
    setHasSold(state === 2);

    // -- Lender

    setLender(lender);
    setHasLended(lenderApproved);

    // -- Inspector

    setInspector(inspector);
    setHasInspected(isInspected);

    if (property.state === 2) {
      setOwner(property.buyer);
    }
  };

  const buyHandler = async () => {
    // const escrowAmount = await escrow.escrowAmount(home.id);
    const escrowAmount = property.purchasePrice // TODO: lending
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
    const transaction = await escrow.connect(signer).approveSale(home.id);
    await transaction.wait();

    // Lender sends funds to contract...
    // const lendAmount = await escrow.purchasePrice(home.id) -
    //   await escrow.escrowAmount(home.id);
    // await signer.sendTransaction({
    //   to: escrow.address,
    //   value: lendAmount.toString(),
    //   gasLimit: 60000,
    // });

    setHasLended(true);
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
                  )
                  : (account === lender)
                  ? (
                    <button
                      className="home__buy"
                      onClick={lendHandler}
                      disabled={hasLended}
                    >
                      Approve & Lend
                    </button>
                  )
                  : (account === seller)
                  ? (
                    <button
                      className="home__buy"
                      onClick={sellHandler}
                      disabled={!(property.state === 1 &&
                        property.isInspected && property.lenderApproved)}
                    >
                      Approve & Sell
                    </button>
                  )
                  : (
                    <button
                      className="home__buy"
                      onClick={buyHandler}
                      disabled={!(property.state === 0)}
                    >
                      Buy
                    </button>
                  )}

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
