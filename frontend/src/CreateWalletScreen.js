import React, { Component } from "react";
import TwitterLogin from "react-twitter-auth";
import { Redirect } from "react-router-dom";
import "whatwg-fetch";
import { registerUser as _registerUser } from "./zilliqa";
import LoadingModal from "./LoadingModal";
const CP = require("@zilliqa-js/crypto");

export default class CreateWalletScreen extends Component {
  constructor() {
    super();
    this.generateWallet = this.generateWallet.bind(this);
    this.requestFunds = this.requestFunds.bind(this);
    this.registerUser = this.registerUser.bind(this);
    this.state = {
      successRequestFund: null,
      successRegisterUser: null,
      privkey: null
    };
  }

  storePrivateKey(privateKey) {
    localStorage.setItem("privateKey", privateKey);
  }

  async generateWallet() {
    const { username } = this.props.location.state.user;
    const privkey = CP.schnorr.generatePrivateKey();
    setTimeout(() => {
      this.setState({ privkey });
      this.storePrivateKey(privkey);
    }, 5000);
    await this.requestFunds(privkey);
    await this.registerUser(privkey, username);
  }

  async registerUser(privkey, username) {
    if (this.state.successRequestFund) {
      const address = CP.getAddressFromPrivateKey(privkey);
      const receipt = await _registerUser(privkey, address, username);
      this.setState({ successRegisterUser: receipt.success });
    }
  }

  async requestFunds(privkey) {
    const { user, token } = this.props.location.state;
    const { id: userId, username, token: twitterToken } = user;
    const address = CP.getAddressFromPrivateKey(privkey);

    const response = await fetch("http://localhost:4000/api/v1/request-funds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token
      },
      body: JSON.stringify({
        username,
        address,
        twitterToken
      })
    });
    const receipt = await response.json();
    console.log(receipt);
    this.setState({ successRequestFund: receipt.success });
    return receipt;
  }

  render() {
    const { successRegisterUser, successRequestFund, privkey } = this.state;

    if (successRequestFund && successRegisterUser) {
      return (
        <Redirect
          to={{
            pathname: "/submit",
            state: {
              ...this.props.location.state
            }
          }}
        />
      );
    }

    let loadingPercent = 0;
    let loadingText = "Generating private key...";
    if (privkey) {
      loadingText = "Requesting funds for wallet...";
      loadingPercent = 33.33;

      if (successRequestFund) {
        loadingText = "Registering wallet in contract...";
        loadingPercent = 66.66;

        if (successRegisterUser) {
          loadingText =
            "Successfully registered wallet in contract. Redirecting you...";
          loadingPercent = 100;
        }
      }
    }

    return (
      <header className="masthead-create">
        <LoadingModal
          title="Your Testnet Wallet"
          loadingPercent={loadingPercent}
          loadingText={loadingText}
        />
        <div className="container h-100">
          <div className="row h-100">
            <div className="col-lg-12 my-auto">
              <div className="header-content mx-auto">
                <h1 className="mb-5">Thanks for registering</h1>
                <h2>
                  You'll also need a Zilliqa testnet wallet address to store the
                  testnet tokens you have.
                </h2>
                <br />
                <p className="warning">
                  Warning: This is a testnet application for demo purposes and
                  only handles testnet ZIL tokens. Please do not send any
                  interim ERC-20 tokens or mainnet tokens here.
                </p>
                <div onClick={this.generateWallet} className="shiny-button">
                  <button
                    type="button"
                    className="btn shiny-button-content"
                    data-toggle="modal"
                    data-target="#exampleModal"
                  >
                    Generate a free testnet wallet for me
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }
}
