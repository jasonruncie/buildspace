import { useEffect, useState } from 'react';
import idl from './idl.json';
import jrLogo from './assets/jason_runcie.gif';
import './App.css';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import {
    Program, Provider, web3
} from '@project-serum/anchor';
import kp from './keypair.json'

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = Keypair.fromSecretKey(secret)

// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devent.
const network = clusterApiUrl('devnet');

// Control's how we want to acknowledge when a trasnaction is "done".
const opts = {
    preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
//Buildspace https://www.arweave.net/ypQasujRp66D0SKV_xHordmrz-qCt_PlixgyzFLUwJA
//Metaplex   https://www.arweave.net/BngVsyYASFLTn_-AJzEDBN2UkSoMF2l51_jzWXUH-Hs

const App = () => {

    const [walletAddress, setWalletAddress] = useState(null);
    const [solanaFound, setSolanaFound] = useState(false);
    // const [triedConnect, setTriedConnect] = useState(false);

    const [inputValue, setInputValue] = useState('');
    const [ambigramList, setAmbigramList] = useState([]);

    const checkIfWalletIsConnected = async () => {
        try {
            const { solana } = window;

            if (solana) {
                setSolanaFound(true);
                if (solana.isPhantom) {
                    console.log('Phantom wallet found!');
                    /*
                    * The solana object gives us a function that will allow us to connect
                    * directly with the user's wallet!
                    */
                    const response = await solana.connect({});
                    console.log(
                        'Connected with Public Key:',
                        response.publicKey.toString()
                    );
                    setWalletAddress(response.publicKey.toString());

                }
            } else {

                //alert('Solana object not found! Get a Phantom Wallet 👻');
            }
        } catch (error) {

            console.error('hmm', error);
        }
    };

    /*
     * Let's define this method so our code doesn't break.
     * We will write the logic for this next!
     */
    const connectWallet = async () => {
        const { solana } = window;

        if (solana) {
            const response = await solana.connect();
            console.log('Connected with Public Key:', response.publicKey.toString());
            setWalletAddress(response.publicKey.toString());
        }
    };
    const onInputChange = (event) => {
        const { value } = event.target;
        setInputValue(value);
    }

    const getProvider = () => {
        const connection = new Connection(network, opts.preflightCommitment);
        const provider = new Provider(
            connection, window.solana, opts.preflightCommitment,
        );
        return provider;
    }
    const createGifAccount = async () => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            console.log("ping")
            await program.rpc.startStuffOff({
                accounts: {
                    baseAccount: baseAccount.publicKey,
                    user: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                },
                signers: [baseAccount]
            });
            console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
            await getGifList();

        } catch (error) {
            console.log("Error creating BaseAccount account:", error)
        }
    }

    const sendAmbigramRequest = async () => {
        if (inputValue.length === 0) {
          console.log("No Ambigram Request given!")
          return
        }
        console.log('Ambigram Request:', inputValue);
        try {
          const provider = getProvider();
          const program = new Program(idl, programID, provider);
      
          await program.rpc.addGif(inputValue, {
            accounts: {
              baseAccount: baseAccount.publicKey,
              user: provider.wallet.publicKey,
            },
          });
          console.log("Ambigram Request sucesfully sent to program", inputValue)
      
          await getGifList();
        } catch (error) {
          console.log("Error sending Ambigram Request:", error)
        }
      };
    /*
     * We want to render this UI when the user hasn't connected
     * their wallet to our app yet.
     */
    const renderNotConnectedContainer = () => (
        <div>
            <button
                className="cta-button connect-wallet-button"
                onClick={connectWallet}
            >
                Connect to Wallet
            </button>

            <h3>{solanaFound ? '' : <a href="https://phantom.app/" target="_blank" rel="noreferrer">Get Phantom</a>}</h3>
        </div>
    );

    const renderConnectedContainer = () => {
        // If we hit this, it means the program account hasn't be initialized.
        if (ambigramList === null) {
            return (
                <div className="connected-container">
                    <button className="cta-button submit-gif-button" onClick={createGifAccount}>
                        Do One-Time Initialization For GIF Program Account
                    </button>
                </div>
            )
        }
        // Otherwise, we're good! Account exists. User can submit GIFs.
        else {
            return (
                <div className="connected-container">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            sendAmbigramRequest();
                        }}
                    >
            <input
                type="text"
                placeholder="Submit Ambigram!"
                value={inputValue}
                onChange={onInputChange}
            />
                        <button type="submit" className="cta-button submit-gif-button">
                            Submit
                        </button>
                    </form>
                    <div className="gif-grid">
                        {/* We use index as the key instead, also, the src is now item.gifLink */}
                        {ambigramList.map((item, index) => (
                            <div className="gif-item" key={index}>
                                <img src={item.gifLink} alt=""/>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
    }



    /*
     * When our component first mounts, let's check to see if we have a connected
     * Phantom Wallet
     */
    useEffect(() => {
        const onLoad = async () => {
            await checkIfWalletIsConnected();
        };
        window.addEventListener('load', onLoad);
        return () => window.removeEventListener('load', onLoad);
    }, []);

    const getGifList = async () => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

            console.log("Got the account", account)
            setAmbigramList(account.gifList)

        } catch (error) {
            console.log("Error in getGifs: ", error)
            setAmbigramList(null);
        }
    }

    useEffect(() => {
        if (walletAddress) {
            console.log('Fetching GIF list...');
            getGifList()
        }
    }, [walletAddress]);

    return (
        <div className="App">
            <div className={walletAddress ? 'authed-container' : 'container'}>
                <div className="header-container">
                    <img alt="Jason Runcie Ambigram" src={jrLogo} width="500px" />
                    <p className="sub-text">
                        JR Ambigrams
                    </p>
                    {!walletAddress && renderNotConnectedContainer()}
                    {walletAddress && renderConnectedContainer()}
                </div>
                <div className="footer-container">

                    <a
                        className="footer-text"
                        href={TWITTER_LINK}
                        target="_blank"
                        rel="noreferrer"
                    >{`built on @${TWITTER_HANDLE}`}</a>
                </div>
            </div>
        </div>
    );
};

export default App;