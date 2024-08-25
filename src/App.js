import React, { useState } from 'react';
import simulatePoWConsensus from './simulation/Simulate';
import Visualization from './components/Visualization';

const App = () => {
  const [steps, setSteps] = useState([]);
  const [numNodes, setNumNodes] = useState(7);
  const [numTraitors, setNumTraitors] = useState(2);
  const [acceptanceRate, setAcceptanceRate] = useState(0.75);
  const [messageLossChance, setMessageLossChance] = useState(0.1);
  const [disruptChance, setDisruptChance] = useState(0.5);
  const [defaultAction, setDefaultAction] = useState("retreat");
  const [msgTamperChance, setMsgTamperChance] = useState(0.1);

  const handleSimulate = () => {
    const { steps } = simulatePoWConsensus(
      numNodes, numTraitors, acceptanceRate, defaultAction, messageLossChance, disruptChance, msgTamperChance
    );
    setSteps(steps);
  };

  return (
    <div style={{ padding: '2rem'}}>
      <h1 style={{ textAlign: 'center', margin: '10px' }}>Byzantine Generals - Consensus</h1>
      <div>
        <h2>Settings</h2>
        <div  style={{ display: 'flex' }}>
          <div style={{ marginRight: '15px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label>
                Number of Nodes:
                <br />
                <input
                  style={{ maxWidth: '48px' }}
                  type="number"
                  value={numNodes}
                  onChange={(e) => setNumNodes(parseInt(e.target.value))}
                />
              </label>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>
                Number of Traitors:
                <br />
                <input
                  style={{ maxWidth: '48px' }}
                  type="number"
                  value={numTraitors}
                  onChange={(e) => setNumTraitors(parseInt(e.target.value))}
                />
              </label>
            </div>
            <div style={{  }}>
              <label>
                Acceptance Rate:
                <br />
                <input
                  style={{ maxWidth: '48px' }}
                  type="number"
                  step="0.01"
                  value={acceptanceRate}
                  onChange={(e) => setAcceptanceRate(parseFloat(e.target.value))}
                />
              </label>
            </div>
          </div>
          <div style={{ marginRight: '15px' }}>
            <div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  Message Tamper Chance:
                  <br />
                  <input
                    style={{ maxWidth: '48px' }}
                    type="number"
                    step="0.01"
                    value={msgTamperChance}
                    onChange={(e) => setMsgTamperChance(parseFloat(e.target.value))}
                  />
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  Message Loss Chance:
                  <br />
                  <input
                    style={{ maxWidth: '48px' }}
                    type="number"
                    step="0.01"
                    value={messageLossChance}
                    onChange={(e) => setMessageLossChance(parseFloat(e.target.value))}
                  />
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  Disrupt Chance:
                  <br />
                  <input
                    style={{ maxWidth: '48px' }}
                    type="number"
                    step="0.01"
                    value={disruptChance}
                    onChange={(e) => setDisruptChance(parseFloat(e.target.value))}
                  />
                </label>
              </div>
            </div>
          </div>
          <div style={{ marginRight: '15px' }}>
            <div>
              <label>
                Default Action:
                <br/>
                <select
                  style={{  }}
                  value={defaultAction}
                  onChange={(e) => setDefaultAction(e.target.value)}
                >
                  <option value="attack">Attack</option>
                  <option value="retreat">Retreat</option>
                </select>
              </label>
            </div>
          </div>
        </div>
        <button style={{ padding: '10px', backgroundColor: 'blue', color: 'white', fontSize: '24px', marginTop: '20px' }} onClick={handleSimulate}>Simulate</button>
      </div>
      
      {steps.length > 0 && <Visualization steps={steps} />}
    </div>
  );
};

export default App;