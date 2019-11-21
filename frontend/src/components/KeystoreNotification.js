import React, { Component } from "react";
import { Zilliqa } from '@zilliqa-js/zilliqa';


const saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, fileName) {
        var json = JSON.stringify(data),
            blob = new Blob([json], { type: "octet/stream" }),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());

export default class KeystoreNotification extends Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.downloadKeystore = this.downloadKeystore.bind(this);

        this.state = {
            passphrase: '',
            keystore: props.keystore,
            privateKey: props.getPrivateKey(), 
            //privateKey: "025de355b88641700f91d29c21b111a8dbc84728367afd691f562a7c3cd6fa2b",
            passError: false,
            fileDownloaded: false
        };
    }

    handleChange(e) {
        this.setState({ passphrase: e.target.value });
    }

    async downloadKeystore(e) {
        this.setState({ passError: false });

        const { privateKey } = this.state;
        const zilliqa = new Zilliqa('https://api.zilliqa.com');

        if (this.state.passphrase.length <= 8) {
            this.setState({ passError: "Passphrase should be longer than 8 characters." });
        } else {
            zilliqa.wallet.addByPrivateKey(privateKey);

            const keystore = await zilliqa.wallet.defaultAccount.toFile(this.state.passphrase);

            localStorage.setItem('keystore', JSON.stringify(keystore));

            saveData(keystore, 'SocialPayKeystore.json');
            this.setState({ fileDownloaded: true });
        }
    }

    onContinue(e) {
        window.location.reload();
    }

    render() {
        const { privateKey, passError, fileDownloaded } = this.state;

        return (<div className="keystore">
            <h3>Your Wallet Access</h3>
            <p>Now that the wallet has been successfully generated, you are in charge of keeping it safe.</p>
            <p className="text-danger"><i className="fas fa-exclamation-triangle"></i><br />
                <b>Please store the following details somewhere safe.<br /> If you lose your Keystore File and Passphrase you won't be able to access your wallet again.</b>
            </p>
            <div className="privateKey">
                <p className="font-weight-bold">Private Key:</p>
                <pre>{privateKey}</pre>
            </div>
            <div className="keystore-file">
                <p className="font-weight-bold mb-0">Keystore File</p>
                <p className="small">Keystore Files need to be encrypted using a secret passhprase.<br />Please remember this passphrase for further actions on the wallet.</p>
                <div className="d-flex">
                    <input type="password" placeholder="Enter passphrase" onChange={this.handleChange} className="input rounded-corners mr-4" /> <button onClick={this.downloadKeystore} className="btn btn-secondary"><i className="fas fa-download"></i> Download Keystore.json</button>
                </div>
                {passError ? (
                    <div className="mt-2 text-danger">{passError}</div>
                ) : null}
            </div>
            {fileDownloaded ? (
                <div className="accept-tos my-4">
                    <button className="btn btn-primary btn-lg" onClick={this.onContinue}><i className="fas fa-arrow-right"></i> Continue to SocialPay</button>
                </div>
            ) : null}
            <p className="small mt-5">
                The wallet generated by SocialPay is only recommended for storing funds you receive here. For any other tokens, we recommend the full feature wallets such  as Moonlet or ZilPay
                  </p>
        </div>)
    }
}