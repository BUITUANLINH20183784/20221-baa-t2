import { ethers } from 'ethers';
import closeSVG from '../assets/close.svg';

const Sell = ({ close }) => {
  return (
    <div className="home">
      <div className="home__details">
        <div className="home__overview">
          <h1>Sell</h1>
        </div>
        <button onClick={close} className="home__close">
          <img src={closeSVG} alt="Close" />
        </button>
      </div>
    </div>
  )
}

export default Sell
