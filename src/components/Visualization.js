import React, { useState } from 'react';
import D3Visualization from './D3Visualization';

const Visualization = ({ steps }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
      {/* Visualization Section */}
      <div style={{ flex: 1 }}>
        {steps.length > 0 && (
          <D3Visualization steps={steps} currentStep={currentStep} />
        )}
        <div style={{  }}>
          <button style={{ padding: '10px', backgroundColor: 'blue', color: 'white', fontSize: '24px' }} onClick={handlePrevious} disabled={currentStep === 0}>Previous</button>
          <button style={{ padding: '10px', backgroundColor: 'blue', color: 'white', fontSize: '24px' }} onClick={handleNext} disabled={currentStep >= steps.length - 1}>Next</button>
          <button style={{ padding: '10px', backgroundColor: 'blue', color: 'white', fontSize: '24px' }} onClick={handleReset}>Reset</button>
        </div>
      </div>

      {/* Logs Section */}
      <div style={{ flex: 1, paddingLeft: '20px', overflow: 'scroll', height: '900px' }}>
        <h1>Step Logs</h1>
        <div style={{ marginBottom: '20px' }}>
          <h2>Step {currentStep + 1}</h2>
          <ul>
            {steps[currentStep]?.logs.map((log, idx) => (
              <li key={idx}>{log}</li>
            ))}
          </ul>
        </div>
        {steps[currentStep]?.detailedLogs.length > 0 && (
        <>
          <hr/>
          <h1>Detailed Logs</h1>
          <div style={{ marginBottom: '20px' }}>
            {steps[currentStep]?.detailedLogs.map((detail, idx) => (
              <div key={idx}>
                <h2>Action: {detail.action}, Node: {detail.nodeId} {detail.nodeTraitor ? "(Traitor)" : ""}</h2>
                {detail.action === 'proposeAction' && detail.nodeDecisions && (
                  <div>
                    <p>Proposed action: {detail.proposedAction}</p>
                    <h3>Node Decisions:</h3>
                    <ul>
                      {Object.entries(detail.nodeDecisions).map(([nodeId, decision], index) => (
                        <li key={index}>Decision from Node {nodeId}: {decision ?? 'No decision (null)'}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {detail.action === 'validateAction' && detail.nodeDecisions && (
                  <div>
                    <h3>Proposed action: {detail.proposedAction}</h3>
                    <h3>Node Decisions:</h3>
                    <ul>
                      {Object.entries(detail.nodeDecisions).map(([nodeId, decision], index) => (
                        <li key={index}>Node {nodeId} decided to: {decision ?? 'No decision (null)'}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {detail.action === 'calculateConsensus' && detail.consensusResults && (
                  <div>
                    <h3>Consensus Results:</h3>
                    <ul>
                      {Object.entries(detail.consensusResults).map(([nodeId, result], index) => (
                        <li key={index}>Node {nodeId}: {result}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
        )}
        <hr/>
        {steps[currentStep]?.nodeStates.length > 0 && (
          <>
            <h1>Node states</h1>
            <div style={{ marginBottom: '20px' }}>
              {steps[currentStep]?.nodeStates.map((nodeState, idx) => (
                <div key={idx} style={{ marginBottom: '10px' }}>
                  <h2>Node {nodeState.id} {nodeState.isTraitor ? '(Traitor)' : ''}</h2>
                  <p><strong>State:</strong> {nodeState.state}</p>
                  {nodeState.action && (<p><strong>Action:</strong> {nodeState.action}</p>)}
                  {nodeState.consensusResults && (<p><strong>Consensus result:</strong> {nodeState.consensusResults}</p>)}

                  {(nodeState.receivedMessages && nodeState.receivedMessages.length > 0) && (
                    <div>
                      <h3>Received Initial Messages:</h3>
                      <ul>
                        {nodeState.receivedMessages.map((msg, index) => (
                          <li key={index}>From Node {msg.from}: {msg.action} {msg.isTampered ? '(Tampered in Transit)' : ''}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(nodeState.receivedInitForwards && nodeState.receivedInitForwards.length > 0) && (
                    <div>
                      <h3>Received Forwards:</h3>
                      <ul>
                        {nodeState.receivedInitForwards.map((msg, index) => (
                          <li key={index}>
                            <strong>Main Message from Node {msg.from}:</strong>
                            {Array.isArray(msg.action) ? (
                              <ul>
                                {msg.action.map((innerMsg, innerIndex) => (
                                  <li key={innerIndex}>
                                    From Node {innerMsg.from} to Node {innerMsg.to}: {innerMsg.action} 
                                    {innerMsg.isTampered ? ' (Tampered)' : ''}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p>{msg.action}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(nodeState.receivedForwards && nodeState.receivedForwards.length > 0) && (
                    <div>
                      <h3>Received Forwards:</h3>
                      <ul>
                        {nodeState.receivedForwards.map((msg, index) => (
                          <li key={index}>
                            From Node {msg.from} to Node {msg.to}: {msg.action} 
                            {msg.isTampered ? ' (Tampered)' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(nodeState.knownTraitors && nodeState.knownTraitors.length > 0) && (
                    <div>
                      <h3>Known Traitors: ({nodeState.knownTraitors.length})</h3>
                      <ul>
                        {nodeState.knownTraitors.map((traitorId, index) => (
                          <li key={index}>Node {traitorId}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(nodeState.nodeDecisions) && (
                    <div>
                      <h3>Node Decisions:</h3>
                      <ul>
                        {Object.entries(nodeState.nodeDecisions).map(([nodeId, decision], index) => (
                          <li key={index}>Node {nodeId}: {decision ?? 'No decision (null)'}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(nodeState.validationResults && nodeState.validationResults.length > 0) && (
                    <div>
                      <h3>Validation Results:</h3>
                      <ul>
                        {Object.entries(nodeState.validationResults).map(([nodeId, result], index) => (
                          <li key={index}>Node {nodeId}: {result}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(nodeState.tamperedList && nodeState.tamperedList.length > 0) && (
                    <div>
                      <h3>Tampered List:</h3>
                      <ul>
                        {nodeState.tamperedList.map((msg, index) => (
                          <li key={index}>
                            <strong>Main Message from Node {msg.from}:</strong>
                            <ul>
                              {msg.action.map((innerMsg, innerIndex) => (
                                <li key={innerIndex}>
                                  From Node {innerMsg.from} to Node {innerMsg.to}: {innerMsg.action} 
                                  {innerMsg.isTampered ? ' (Tampered)' : ''}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(nodeState.discrepancyList && nodeState.discrepancyList.length > 0) && (
                    <div>
                      <h3>Discrepancy List:</h3>
                      <ul>
                        {nodeState.discrepancyList.map((msg, index) => (
                          <li key={index}>From Node {msg.from}: {msg.action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(nodeState.tempReceivedMessages && nodeState.tempReceivedMessages.length > 0) && (
                    <div>
                      <h3>Temporary Received Messages:</h3>
                      <ul>
                        {nodeState.tempReceivedMessages.map((msg, index) => (
                          <li key={index}>From Node {msg.from}: {msg.action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(nodeState.tempReceivedForwards && nodeState.tempReceivedForwards.length > 0) && (
                    <div>
                      <h3>Temporary Received Forwards:</h3>
                      <ul>
                        {nodeState.tempReceivedForwards.map((msg, index) => (
                          <li key={index}>From Node {msg.from}: {msg.action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Visualization;