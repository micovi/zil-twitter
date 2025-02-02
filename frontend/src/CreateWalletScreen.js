import React, { Component } from "react";
import "whatwg-fetch";
import { registerUser, isUserRegistered } from "./zilliqa";
import LoadingModal from "./LoadingModal";
import { CURRENT_URI } from "./utils";
const CP = require("@zilliqa-js/crypto");

export default class CreateWalletScreen extends Component {
  constructor() {
    super();
    this.generateWallet = this.generateWallet.bind(this);
    this.generateKey = this.generateKey.bind(this);
    this.requestFunds = this.requestFunds.bind(this);
    this.register = this.register.bind(this);
    this.getUsername = this.getUsername.bind(this);
    this.state = {
      redirectBack: false,
      successRequestFund: null,
      successRegisterUser: null,
      privateKey: null,
      errMsg: null
    };
  }

  getUsername() {
    const username = localStorage.getItem("authenticatedUsername");
    if (username) {
      return username;
    } else {
      this.props.onLogout(true);
    }
  }

  async generateWallet() {
    let privateKey = null;
    try {
      const username = this.getUsername();
      const isRegistered = await isUserRegistered(username);

      if (!isRegistered) {
        this.generateKey();
        privateKey = this.state.privateKey;
        // await this.requestFunds(privateKey);
        console.log('awaiting registration');
	await this.register(privateKey, username);
        localStorage.setItem("walletAddress", CP.getAddressFromPrivateKey(privateKey));
      } else {
        throw new Error('Your account is already registered.');
      }

      window.$('#loadingModal').modal('toggle');
      this.props.handleWalletStateChange(true, privateKey);

    } catch (e) {
      this.setState({ errMsg: e.message });
    }
  }

  generateKey() {
    const privateKey = CP.schnorr.generatePrivateKey();
    this.setState({ privateKey });
  }

  async register(privateKey, username) {
      const address = CP.getAddressFromPrivateKey(privateKey);

      try {
        const response = await fetch(`${CURRENT_URI}/api/v1/register-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address,
            username
          }),
          credentials: "include"
        });

        if (response.status === 401) {
          window.$('#loadingModal').modal("hide");
          window.$('body').removeClass('modal-open'); 
          window.$('.modal-backdrop').remove();
          this.props.onLogout(true);
          return;
        }

        const data = await response.json();

        this.setState({ successRegisterUser: data.receipt.success });
       // return data;
      } catch (e) {
        console.log(e);
        throw new Error("Failed to verify tweet. Please try again.");
      }

  }

  async requestFunds(privateKey) {
    const address = CP.getAddressFromPrivateKey(privateKey);

    try {
      const response = await fetch(`${CURRENT_URI}/api/v1/request-funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
        credentials: 'include'
      });
      // Cookie has expired
      if (response.status === 401) {
        window.$('#loadingModal').modal("hide");
        window.$('body').removeClass('modal-open');
        window.$('.modal-backdrop').remove();
        //this.props.onLogout(true);
        throw Error;
      }
      const receipt = await response.json();
      this.setState({ successRequestFund: receipt.success });
      // this.setState({ successRequestFund: true });
    } catch (e) {
      throw Error("Failed in requesting funds.\nPlease refresh and try again.");
    }
  }

  render() {
    const {
      successRegisterUser,
      successRequestFund,
      errMsg,
      privateKey
    } = this.state;

    const msg = "\nPlease be patient, do not close this window.";
    let loadingText = "Checking if already registered";

    if (successRegisterUser && successRequestFund && privateKey) {
      loadingText = "Successfully registered wallet in contract. Redirecting you...";
    } else if (successRequestFund && privateKey) {
      loadingText = "Registering wallet in contract..." + msg;
    } else if (privateKey) {
      loadingText = "Requesting funds for wallet..." + msg;
    }
    return (
      <header className="masthead-create">
        <LoadingModal
          title="Your Testnet Wallet"
          loadingText={loadingText}
          errorText={errMsg}
        />
        <div className="container h-100">
          <div className="row h-100">
            <div className="col-lg-12 my-auto">
              <div className="header-content mx-auto">
                <h1 className="mb-5">Thanks for registering</h1>
                <h2>
                  You'll also need a Zilliqa testnet wallet address to store the
                  testnet tokens you have.
                  <br />
                  <br />
                  We will get you started with a wallet, loaded with 50 testnet
                  ZIL tokens.
                </h2>
                <br />
                <p className="warning">
                  Warning: This is a testnet application for demo purposes and
                  only handles testnet ZIL tokens. Please do not send any
                  interim ERC-20 tokens or mainnet tokens here.
                </p>
                <div onClick={this.generateWallet} className="shiny-button">
                  <button
                    type="button" className="btn shiny-button-content"
                    data-toggle="modal"
                    data-target="#loadingModal"
                    data-backdrop="static"
                    data-keyboard="false"
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
