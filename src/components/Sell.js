import { ethers } from "ethers";
import { useState } from "react";
import closeSVG from "../assets/close.svg";

const Sell = ({ close, provider, account, realEstate, escrow, fetchHomes }) => {
  const initialProperty = {
    name: "",
    address: "",
    description: "",
    image: "",
    id: "",
    purchasePrice: 0,
    typeOfResidence: "",
    bedRooms: 0,
    bathrooms: 0,
    squareFeet: 0,
    yearBuilt: 0,
    escrowAmount: 0,
  };
  const [property, setProperty] = useState(initialProperty);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [status, setStatus] = useState("Approve");
  const uploadIPFS = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const { IpfsHash } = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        body: formData,
        headers: {
          "pinata_api_key": `${process.env.REACT_APP_PINATA_API_KEY}`,
          "pinata_secret_api_key": `${process.env.REACT_APP_PINATA_API_SECRET}`,
        },
      },
    ).then((res) => res.json());
    return IpfsHash ? `https://gateway.pinata.cloud/ipfs/${IpfsHash}` : null;
  };

  return (
    <div className="home">
      <div className="home__details">
        <div className="home__overview">
          <h1>Sell</h1>
          <form className="sell__form">
            <div className="sell__mult">
              <div className="sell__field">
                <label>Name</label>
                <input
                  type="text"
                  value={property.name}
                  onChange={(e) =>
                    setProperty({ ...property, name: e.target.value })}
                  required
                >
                </input>
              </div>
              <div className="sell__field">
                <label>Address</label>
                <input
                  type="text"
                  value={property.address}
                  onChange={(e) =>
                    setProperty({ ...property, address: e.target.value })}
                  required
                >
                </input>
              </div>
            </div>
            <div className="sell__field">
              <label>Description</label>
              <textarea
                value={property.description}
                onChange={(e) =>
                  setProperty({ ...property, description: e.target.value })}
              >
              </textarea>
            </div>
            <div className="sell__field">
              <label>Image</label>
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={(e) => {
                  if (e.target.files?.length !== 0) {
                    setUploadedImage(e.target.files[0]);
                  }
                }}
              />
            </div>
            <div className="sell__mult">
              <div className="sell__field">
                <label>Purchase Price</label>
                <input
                  type="number"
                  value={property.purchasePrice}
                  onChange={(e) =>
                    setProperty({ ...property, purchasePrice: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                >
                </input>
              </div>
              <div className="sell__field">
                <label>Type of Residence</label>
                <input
                  type="text"
                  value={property.typeOfResidence}
                  onChange={(e) =>
                    setProperty({
                      ...property,
                      typeOfResidence: e.target.value,
                    })}
                  required
                >
                </input>
              </div>
              <div className="sell__field">
                <label>Bed Rooms</label>
                <input
                  type="number"
                  value={property.bedRooms}
                  onChange={(e) =>
                    setProperty({ ...property, bedRooms: e.target.value })}
                  min="0"
                  required
                >
                </input>
              </div>
              <div className="sell__field">
                <label>Bathrooms</label>
                <input
                  type="number"
                  value={property.bathrooms}
                  onChange={(e) =>
                    setProperty({ ...property, bathrooms: e.target.value })}
                  min="0"
                  required
                >
                </input>
              </div>
              <div className="sell__field">
                <label>Square Feet</label>
                <input
                  type="number"
                  value={property.squareFeet}
                  onChange={(e) =>
                    setProperty({ ...property, squareFeet: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                >
                </input>
              </div>
              <div className="sell__field">
                <label>Year Built</label>
                <input
                  type="number"
                  value={property.yearBuilt}
                  onChange={(e) =>
                    setProperty({ ...property, yearBuilt: e.target.value })}
                  min="0"
                  required
                >
                </input>
              </div>
              <div className="sell__field">
                <label>Escrow Amount</label>
                <input
                  type="number"
                  value={property.escrowAmount}
                  onChange={(e) =>
                    setProperty({ ...property, escrowAmount: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                >
                </input>
              </div>
            </div>
            <input
              type="submit"
              className="home__buy"
              onClick={async (e) => {
                e.preventDefault();
                if (
                  property.name !== "" &&
                  property.address !== "" &&
                  property.purchasePrice !== null &&
                  property.purchasePrice >= 0 &&
                  property.typeOfResidence !== "" &&
                  property.bedRooms !== null && property.bedRooms >= 0 &&
                  property.bathrooms !== null && property.bathrooms >= 0 &&
                  property.squareFeet !== null && property.squareFeet >= 0 &&
                  property.yearBuilt !== null && property.yearBuilt >= 0 &&
                  property.escrowAmount !== null && property.escrowAmount >= 0
                ) {
                  setStatus("Loading");
                  // let imgLink;
                  // if (uploadedImage) {
                  //   imgLink = await uploadIPFS(uploadedImage);
                  // } else imgLink = "";
                  const imgLink = uploadedImage
                    ? (await uploadIPFS(uploadedImage))
                    : "";
                  if (imgLink) {
                    const currentId = Number(await realEstate.totalSupply()) + 1;
                    const newProperty = {
                      "name": property.name,
                      "address": property.address,
                      "description": property.description,
                      "image": imgLink,
                      "id": currentId,
                      "attributes": [
                        {
                          "trait_type": "Purchase Price",
                          "value": property.purchasePrice,
                        },
                        {
                          "trait_type": "Type of Residence",
                          "value": property.typeOfResidence,
                        },
                        {
                          "trait_type": "Bed Rooms",
                          "value": property.bedRooms,
                        },
                        {
                          "trait_type": "Bathrooms",
                          "value": property.bathrooms,
                        },
                        {
                          "trait_type": "Square Feet",
                          "value": property.squareFeet,
                        },
                        {
                          "trait_type": "Year Built",
                          "value": property.yearBuilt,
                        },
                      ],
                    };
                    const res = await fetch(
                      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                      {
                        method: "POST",
                        body: JSON.stringify({
                          pinataContent: newProperty,
                        }),
                        headers: {
                          "pinata_api_key":
                            `${process.env.REACT_APP_PINATA_API_KEY}`,
                          "pinata_secret_api_key":
                            `${process.env.REACT_APP_PINATA_API_SECRET}`,
                          "Content-Type": "application/json",
                        },
                      },
                    ).then((res) => res.json());
                    if (res.IpfsHash) {
                      setStatus("Processing");
                      const { IpfsHash } = res;
                      const signer = await provider.getSigner();
                      await realEstate.connect(signer).mint(
                        `https://gateway.pinata.cloud/ipfs/${IpfsHash}`,
                      ).then((transaction) => transaction.wait());
                      fetchHomes(realEstate);
                      const tokens = (n) => {
                        return ethers.utils.parseUnits(n.toString(), "ether");
                      };
                      let transaction;
                      transaction = await realEstate.connect(signer).approve(
                        escrow.address,
                        currentId,
                      );
                      await transaction.wait();
                      transaction = await escrow.connect(signer).list(
                        currentId,
                        tokens(property.purchasePrice),
                        tokens(property.escrowAmount),
                      );
                      await transaction.wait();
                      close();
                    } else {
                      setStatus("Error");
                      console.log({ res });
                    }
                  } else console.log("Image error");
                }
              }}
              value={status}
              disabled={status !== "Approve"}
            />
          </form>
        </div>
        <button onClick={close} className="home__close">
          <img src={closeSVG} alt="Close" />
        </button>
      </div>
    </div>
  );
};

export default Sell;
