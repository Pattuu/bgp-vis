import Node from './Node';
import Message from './Message';

const simulate = (
  numNodes,
  numTraitors,
  acceptanceRate,
  defaultAction = 'retreat',
  messageLossChance = 0.1,
  disruptChance,
  tamperChance
) => {
  const nodes = [];
  const steps = [];
  let initialLines = [];

  const indices = Array.from({ length: numNodes }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const traitorIndices = new Set(indices.slice(0, numTraitors));

  for (let i = 0; i < numNodes; i++) {
    const isTraitor = traitorIndices.has(i);
    nodes.push(new Node(i, isTraitor, disruptChance, tamperChance, messageLossChance, defaultAction, numNodes));
  }

  if (nodes.length < 30) {
    for (let i = 0; i < numNodes; i++) {
      for (let j = 0; j < numNodes; j++) {
        if (i !== j) {
          initialLines.push({
            source: i,
            target: j,
            color: 'black',
            dashed: false
          });
        }
      }
    }
  }

  // Step 0: Initial Clean Slate
  const step0 = { nodes: [], lines: [], logs: [], detailedLogs: [], nodeStates: [] };
  step0.nodes = nodes.map(node => ({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor }));
  step0.lines = [...initialLines];
  step0.logs.push(`Initial state`);
  step0.nodeStates = nodes.map(node => ({
    id: node.id,
    isTraitor: node.isTraitor,
    state: node.state,
  }));
  steps.push(step0);

  // Step 1: Initial Actions
  const step1 = { nodes: [], lines: [], logs: [], detailedLogs: [], nodeStates: [] };
  nodes.forEach(node => {
    node.decideInitialAction();
    step1.nodes.push({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor });
    step1.logs.push(`Node ${node.id}${node.isTraitor ? ' (Traitor)' : ''} decided to ${node.action}`);
    step1.nodeStates.push({
      id: node.id,
      isTraitor: node.isTraitor,
      state: node.state,
      action: node.action,
    });
  });
  step1.lines = [...initialLines];
  steps.push(step1);

  // Step 2: Broadcast Messages
  const step2 = { nodes: [], lines: [...initialLines], logs: [], detailedLogs: [], nodeStates: [] };
  nodes.forEach(sender => {
    nodes.forEach(receiver => {
      if (sender.id !== receiver.id) {
        const message = sender.sendMessage(receiver);
        const lineColor = !message ? 'black' : (message.isTampered ? 'red' : (message.action === 'attack' ? 'lightblue' : 'yellow'));
        const dashed = !message || (message && message.isTampered);

        if (nodes.length < 30) {
          const lineIndex = step2.lines.findIndex(line => line.source === sender.id && line.target === receiver.id);
          if (lineIndex !== -1) {
            step2.lines[lineIndex] = {
              source: sender.id,
              target: receiver.id,
              color: lineColor,
              dashed: dashed
            };
          }
        }

        if (message && !message.isTampered) {
          step2.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''} sent "${message.action}" message to Node ${receiver.id}${receiver.isTraitor ? ' (Traitor)' : ''}`);
        } else if (message && message.isTampered) {
          step2.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''} sent "${message.action === 'attack' ? 'retreat' : 'attack'}" message to Node ${receiver.id}${receiver.isTraitor ? ' (Traitor)' : ''} but it was tampered in transit`);
        } else {
          step2.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''}'s message to Node ${receiver.id}${receiver.isTraitor ? ' (Traitor)' : ''} was lost`);
        }
      }
    });
  });
  step2.nodes = nodes.map(node => ({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor }));
  step2.nodeStates = nodes.map(node => ({
    id: node.id,
    isTraitor: node.isTraitor,
    state: node.state,
    action: node.action,
    receivedMessages: [...node.receivedInitMessages],
    nodeDecisions: JSON.parse(JSON.stringify(node.nodeDecisions)),
  }));
  steps.push(step2);

  // Step 3: Forwarding Received Messages
  const step3 = { nodes: [], lines: [...initialLines], logs: [], detailedLogs: [], nodeStates: [] };
  nodes.forEach(sender => {
    nodes.forEach(receiver => {
      if (sender.id !== receiver.id) {
        const message = sender.forwardInitMessages(receiver);
        const lineColor = !message ? 'black' : (message.isTampered ? 'red' : 'white');
        const dashed = !message || (message && message.isTampered);
        
        if (nodes.length < 30) {
          const lineIndex = step3.lines.findIndex(line => line.source === sender.id && line.target === receiver.id);
          if (lineIndex !== -1) {
            step3.lines[lineIndex] = {
              source: sender.id,
              target: receiver.id,
              color: lineColor,
              dashed: dashed
            };
          }
        }
        receiver.state = 'checking';

        if (message && !message.isTampered) {
          step3.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''} forwarded received messages to Node ${receiver.id}${receiver.isTraitor ? ' (Traitor)' : ''}`);
        } else if (message && message.isTampered) {
          step3.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''} forwarded received messages to Node ${receiver.id}${receiver.isTraitor ? ' (Traitor)' : ''} but it was tampered in transit`);
        } else {
          step3.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''} forwarded received messages to Node ${receiver.id}${receiver.isTraitor ? ' (Traitor)' : ''} were lost`);
        }
      }
    });
  });
  step3.nodes = nodes.map(node => ({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor }));
  step3.nodeStates = nodes.map(node => ({
    id: node.id,
    isTraitor: node.isTraitor,
    state: node.state,
    action: node.action,
    receivedInitForwards: [...node.receivedInitForwards],
  }));
  steps.push(step3);

  // Step 4: Cross-Referencing and Flagging Traitors
  nodes.forEach(node => node.processForwardedMessages());
  const step4 = { nodes: [], lines: [...initialLines], logs: [], detailedLogs: [], nodeStates: [] };
  nodes.forEach(node => {
    if (node.isTraitor) {
      step4.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} did not do anything`);
    } else {
      const tamperedTraitors = node.tamperedList.map(msg => msg.from).filter((v, i, a) => a.indexOf(v) === i);

      if (tamperedTraitors.length > 0) {
        step4.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} found evidence of tampering in the forwarded messages and flagged Nodes ${tamperedTraitors.join(', ')} as traitors.`);
      } else {
        step4.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} found no evidence of tampering in the forwarded messages.`);
      }


      const discrepancyTraitors = node.discrepancyList.map(msg => msg.from).filter((v, i, a) => a.indexOf(v) === i);
      if (discrepancyTraitors.length > 0) {
        step4.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} cross-referenced messages and found discrepancies in Nodes ${discrepancyTraitors.join(', ')} actions.`);
      } else {
        step4.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} cross-referenced messages and found no discrepancies.`);
      }
    }
  });
  step4.nodes = nodes.map(node => ({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor }));
  step4.nodeStates = nodes.map(node => ({
    id: node.id,
    isTraitor: node.isTraitor,
    state: node.state,
    action: node.action,
    receivedForwards: [...node.receivedForwards],
    tamperedList: [...node.tamperedList],
    discrepancyList: [...node.discrepancyList],
    knownTraitors: [...node.knownTraitors],
    nodeDecisions: JSON.parse(JSON.stringify(node.nodeDecisions)),
  }));
  steps.push(step4);

  // Step 5: Further forward
  const step5 = { nodes: [], lines: [...initialLines], logs: [], detailedLogs: [], nodeStates: [] };
  nodes.forEach(sender => {
    if (!sender.isTraitor) {
      nodes.forEach(receiver => {
        if (sender.id !== receiver.id) {
          const message = sender.furtherForwardInit(receiver);
          const lineColor = !message ? 'black' : (message.isTampered ? 'red' : 'white');
          const dashed = !message || (message && message.isTampered);

          if (nodes.length < 30) {
            const lineIndex = step5.lines.findIndex(line => line.source === sender.id && line.target === receiver.id);
            if (lineIndex !== -1) {
              step5.lines[lineIndex] = {
                source: sender.id,
                target: receiver.id,
                color: lineColor,
                dashed: dashed
              };
            }
          }

          receiver.state = 'checking2';

          if (message && !message.isTampered) {
            step5.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''} forwarded additional information to Node ${receiver.id}${receiver.isTraitor ? ' (Traitor)' : ''}`);
          } else if (message && message.isTampered) {
            step5.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''} forwarded additional information to Node ${receiver.id}${receiver.isTraitor ? ' (Traitor)' : ''} but it was tampered in transit`);
          } else {
            step5.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''} forwarded additional information to Node ${receiver.id}${receiver.isTraitor ? ' (Traitor)' : ''} were lost`);
          }
        }
      });
    } else {
      step5.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''} didn't forward anything`);
    }
  });
  step5.nodes = nodes.map(node => ({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor }));
  step5.nodeStates = nodes.map(node => ({
    id: node.id,
    isTraitor: node.isTraitor,
    state: node.state,
    action: node.action,
    knownTraitors: [...node.knownTraitors],
    tamperedList: [...node.tamperedList],
    discrepancyList: [...node.discrepancyList],
    knownTraitors: [...node.knownTraitors],
    nodeDecisions: JSON.parse(JSON.stringify(node.nodeDecisions)),
  }));
  nodes.forEach(node => {
    node.clearTemps();
  });
  steps.push(step5);

  // Step 6: Second cross reference and results
  nodes.forEach(node => node.processFurtherForwards());
  const step6 = { nodes: [], lines: [...initialLines], logs: [], detailedLogs: [], nodeStates: [] };
  nodes.forEach(node => {
    if (node.isTraitor) {
      step6.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} did not do anything`);
    } else {
      const tamperedTraitors = node.tamperedList.map(msg => msg.from).filter((v, i, a) => a.indexOf(v) === i);
      if (tamperedTraitors.length > 0) {
        step6.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} found evidence of tampering in the forwarded messages and flagged Nodes ${tamperedTraitors.join(', ')} as traitors.`);
      } else {
        step6.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} found no evidence of tampering in the forwarded messages.`);
      }

      const discrepancyTraitors = node.discrepancyList.map(msg => msg.from).filter((v, i, a) => a.indexOf(v) === i);
      if (discrepancyTraitors.length > 0) {
        step6.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} cross-referenced messages and found discrepancies in Nodes ${discrepancyTraitors.join(', ')} actions.`);
      } else {
        step6.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} cross-referenced messages and found no discrepancies.`);
      }

      if (node.knownTraitors.length > 0) {
        step6.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} finalized Nodes ${node.knownTraitors.join(', ')} as traitors.`);
      } else {
        step6.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} did not finalize any traitors.`);
      }
    }
  });
  step6.nodes = nodes.map(node => ({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor }));
  step6.nodeStates = nodes.map(node => ({
    id: node.id,
    isTraitor: node.isTraitor,
    state: node.state,
    action: node.action,
    tamperedList: [...node.tamperedList],
    discrepancyList: [...node.discrepancyList],
    knownTraitors: [...node.knownTraitors],
    nodeDecisions: JSON.parse(JSON.stringify(node.nodeDecisions)),
  }));
  nodes.forEach(node => {
    node.clearTemps();
  });
  steps.push(step6);

  // Step 7: Further forward
  const step7 = { nodes: [], lines: [...initialLines], logs: [], detailedLogs: [], nodeStates: [] };
  nodes.forEach(sender => {
    if (!sender.isTraitor) {
      nodes.forEach(receiver => {
        if (sender.id !== receiver.id) {
          const message = sender.furtherForwardInit(receiver);
          const lineColor = !message ? 'black' : (message.isTampered ? 'red' : 'white');
          const dashed = !message || (message && message.isTampered);

          if (nodes.length < 30) {
            const lineIndex = step7.lines.findIndex(line => line.source === sender.id && line.target === receiver.id);
            if (lineIndex !== -1) {
              step7.lines[lineIndex] = {
                source: sender.id,
                target: receiver.id,
                color: lineColor,
                dashed: dashed
              };
            }
          }

          receiver.state = 'checking2';

          if (message && !message.isTampered) {
            step7.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''} forwarded additional information to Node ${receiver.id}${receiver.isTraitor ? ' (Traitor)' : ''}`);
          } else if (message && message.isTampered) {
            step7.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''} forwarded additional information to Node ${receiver.id}${receiver.isTraitor ? ' (Traitor)' : ''} but it was tampered in transit`);
          } else {
            step7.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''} forwarded additional information to Node ${receiver.id}${receiver.isTraitor ? ' (Traitor)' : ''} were lost`);
          }
        }
      });
    } else {
      step7.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''} didn't forward anything`);
    }
  });
  step7.nodes = nodes.map(node => ({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor }));
  step7.nodeStates = nodes.map(node => ({
    id: node.id,
    isTraitor: node.isTraitor,
    state: node.state,
    action: node.action,
    knownTraitors: [...node.knownTraitors],
    tempTamperedList: [...node.tempTamperedList],
    tempDiscrepancyList: [...node.tempDiscrepancyList],
    tempKnownTraitors: [...node.tempKnownTraitors],
    tempReceivedForwards: [...node.tempReceivedForwards],
    tempReceivedMessages: [...node.tempReceivedMessages],
  }));
  steps.push(step7);
  
  // Step 8: Third cross reference and results
  nodes.forEach(node => node.processFurtherForwards());
  const step8 = { nodes: [], lines: [...initialLines], logs: [], detailedLogs: [], nodeStates: [] };
  nodes.forEach(node => {
    if (node.isTraitor) {
      step8.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} did not do anything`);
    } else {
      const tamperedTraitors = node.tamperedList.map(msg => msg.from).filter((v, i, a) => a.indexOf(v) === i);
      if (tamperedTraitors.length > 0) {
        step8.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} found evidence of tampering in the forwarded messages and flagged Nodes ${tamperedTraitors.join(', ')} as traitors.`);
      } else {
        step8.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} found no evidence of tampering in the forwarded messages.`);
      }
  
      const discrepancyTraitors = node.discrepancyList.map(msg => msg.from).filter((v, i, a) => a.indexOf(v) === i);
      if (discrepancyTraitors.length > 0) {
        step8.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} cross-referenced messages and found discrepancies in Nodes ${discrepancyTraitors.join(', ')} actions.`);
      } else {
        step8.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} cross-referenced messages and found no discrepancies.`);
      }
  
      if (node.knownTraitors.length > 0) {
        step8.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} finalized Nodes ${node.knownTraitors.join(', ')} as traitors.`);
      } else {
        step8.logs.push(`Node ${node.id}${node.isTraitor ? " (Traitor)" : ""} did not finalize any traitors.`);
      }
    }
  });
  step8.nodes = nodes.map(node => ({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor }));
  step8.nodeStates = nodes.map(node => ({
    id: node.id,
    isTraitor: node.isTraitor,
    state: node.state,
    action: node.action,
    tamperedList: [...node.tamperedList],
    discrepancyList: [...node.discrepancyList],
    knownTraitors: [...node.knownTraitors],
    nodeDecisions: JSON.parse(JSON.stringify(node.nodeDecisions)),
  }));
  steps.push(step8);
  

  // Step 9: Choosing action proposer
  const step9 = { nodes: [], lines: [...initialLines], logs: [], detailedLogs: [], nodeStates: [] };
  nodes.forEach(node => {
    node.state = 'decided';
  })

  let proposer = nodes[Math.floor(Math.random() * nodes.length)];
  let i = 0;
  while (i < 500) {
    let isKnownTraitor = false;
    nodes.forEach(node => {
      if (node.knownTraitors.includes(proposer.id)) {
        isKnownTraitor = true;
      }
    });
    if (isKnownTraitor) {
      proposer = nodes[Math.floor(Math.random() * nodes.length)];
      i++;
    } else {
      break;
    }
  }

  const proposedAction = proposer.determineProposedAction();

  step9.nodes = nodes.map(node => ({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor }));
  step9.nodeStates = nodes.map(node => ({
    id: node.id,
    isTraitor: node.isTraitor,
    state: node.state,
    action: node.action,
    knownTraitors: [...node.knownTraitors],
    nodeDecisions: JSON.parse(JSON.stringify(node.nodeDecisions)),
  }));
  step9.logs.push(`Node ${proposer.id}${proposer.isTraitor ? ' (Traitor)' : ''} proposed action ${proposedAction}`);
  step9.detailedLogs.push({ action: 'proposeAction', nodeId: proposer.id, nodeTraitor: proposer.isTraitor, proposedAction: proposedAction, nodeDecisions: proposer.nodeDecisions });
  steps.push(step9);

  proposer.state = 'accepted';

  // Step 10: Propose action
  const step10 = { nodes: [], lines: [...initialLines], logs: [], detailedLogs: [], nodeStates: [] };
  nodes.forEach(node => {
    if (node.id !== proposer.id) {
      step10.logs.push(`Node ${proposer.id}${proposer.isTraitor ? ' (Traitor)' : ''} proposed the action to Node ${node.id}${node.isTraitor ? ' (Traitor)' : ''}`);
      node.state = 'validating';

      if (nodes.length < 30) {
        const lineIndex = step10.lines.findIndex(line => line.source === proposer.id && line.target === node.id);
        if (lineIndex !== -1) {
          step10.lines[lineIndex] = {
            source: proposer.id,
            target: node.id,
            color: 'orange',
            dashed: false
          };
        }
      }
    }
  });
  step10.nodes = nodes.map(node => ({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor }));
  step10.nodeStates = nodes.map(node => ({
    id: node.id,
    isTraitor: node.isTraitor,
    state: node.state,
    action: node.action,
    knownTraitors: [...node.knownTraitors],
    nodeDecisions: JSON.parse(JSON.stringify(node.nodeDecisions)),
  }));
  steps.push(step10);

  // Step 11: Check action
  const step11 = { nodes: [], lines: [...initialLines], logs: [], detailedLogs: [], nodeStates: [] };
  nodes.forEach(node => {
    if (node.id !== proposer.id) {
      let isValid = node.determineAction(node.nodeDecisions) === proposedAction ? true : false;
      if (node.isTraitor) {
        isValid = !isValid;
      }
      if (nodes.length < 30) {
        const lineIndex = step11.lines.findIndex(line => line.source === node.id && line.target === proposer.id);
        if (lineIndex !== -1) {
          step11.lines[lineIndex] = {
            source: node.id,
            target: proposer.id,
            color: isValid ? 'green' : 'red',
            dashed: false
          };
        }
      }
      if (isValid) {
        node.state = 'accepted';
        node.validationResults[node.id] = 'accepted';
      } else {
        node.state = 'rejected';
        node.validationResults[node.id] = 'rejected';
      }
      if (!isValid) {
        step11.logs.push(`Node ${node.id}${node.isTraitor ? ' (Traitor)' : ''} rejected the action`);
      } else {
        step11.logs.push(`Node ${node.id}${node.isTraitor ? ' (Traitor)' : ''} accepted the action`);
      }
      step11.detailedLogs.push({
        action: 'validateAction',
        nodeId: node.id,
        nodeTraitor: node.isTraitor,
        proposedAction: proposedAction,
        nodeDecisions: node.nodeDecisions
      });
    }
  });
  step11.nodes = nodes.map(node => ({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor }));
  step11.nodeStates = nodes.map(node => ({
    id: node.id,
    isTraitor: node.isTraitor,
    state: node.state,
    action: node.action,
    knownTraitors: [...node.knownTraitors],
    nodeDecisions: JSON.parse(JSON.stringify(node.nodeDecisions)),
  }));
  steps.push(step11);

  // Step 12: Broadcast Validation Results
  const step12 = { nodes: [], lines: [...initialLines], logs: [], detailedLogs: [], nodeStates: [] };

  nodes.forEach(sender => {
    nodes.forEach(receiver => {
      if (sender.id !== receiver.id) {
        const result = sender.isTraitor && Math.random() < sender.disruptChance ? sender.state === 'accepted' ? "rejected" : "accepted" : sender.state;
        const message = new Message(
          `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sender.id,
          receiver.id,
          'validationResult',
          result
        );
        receiver.receiveMessage(message, 3);

        step12.logs.push(`Node ${sender.id}${sender.isTraitor ? ' (Traitor)' : ''} sent validation result "${message.action}" to Node ${receiver.id}${receiver.isTraitor ? ' (Traitor)' : ''}`);

        if (nodes.length < 30) {
          const lineIndex = step12.lines.findIndex(line => line.source === sender.id && line.target === receiver.id);
          if (lineIndex !== -1) {
            step12.lines[lineIndex] = {
              source: sender.id,
              target: receiver.id,
              color: message.action === 'accepted' ? 'green' : 'red',
              dashed: false
            };
          }
        }
      }
    });
  });

  step12.nodes = nodes.map(node => ({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor }));
  step12.nodeStates = nodes.map(node => ({
    id: node.id,
    isTraitor: node.isTraitor,
    state: node.state,
    action: node.action,
    knownTraitors: [...node.knownTraitors],
    nodeDecisions: JSON.parse(JSON.stringify(node.nodeDecisions)),
    validationResults: [...node.validationResults],
  }));
  steps.push(step12);

  // Step 13: Calculate Consensus
  const step13 = { nodes: [], lines: [...initialLines], logs: [], detailedLogs: [], nodeStates: [] };

  nodes.forEach(node => {
    let accepts = 0;
    for (let i = 0; i < node.validationResults.length; i++) {
      if (node.validationResults[i] == 'accepted' && !node.knownTraitors.includes(i)) {
        accepts++;
      }
    }
    const acceptedCount = accepts;

    const consensusResult = acceptedCount / (numNodes - node.knownTraitors.length) >= acceptanceRate ? 'consensus' : 'no consensus';
    node.consensusDecision = consensusResult === 'consensus' ? proposedAction : defaultAction;

    step13.detailedLogs.push({
      action: 'calculateConsensus',
      nodeId: node.id,
      nodeTraitor: node.isTraitor,
      consensusResults: {
        acceptedCount: acceptedCount,
        amountOfNodes: (numNodes - node.knownTraitors.length),
        consensusReached: consensusResult
      }
    });

    if (acceptedCount / (numNodes - node.knownTraitors.length) >= acceptanceRate) {
      if (node.isTraitor) {
        node.action = Math.random() < node.disruptChance ? 'retreat' : 'attack';
        node.state = 'finalized';
        step13.logs.push(`Node ${node.id}${node.isTraitor ? ' (Traitor)' : ''} randomly finalized action to ${node.action}`);
      } else {
        node.action = proposedAction;
        node.state = 'finalized';
        step13.logs.push(`Node ${node.id}${node.isTraitor ? ' (Traitor)' : ''} finalized action to ${node.action} based on consensus`);
      }
    } else {
      node.action = defaultAction;
      node.state = 'finalized';
      step13.logs.push(`Node ${node.id}${node.isTraitor ? ' (Traitor)' : ''} did not reach consensus, finalized action to ${node.action}`);
    }
  });

  step13.nodes = nodes.map(node => ({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor }));
  step13.nodeStates = nodes.map(node => ({
    id: node.id,
    isTraitor: node.isTraitor,
    state: node.state,
    action: node.action,
    consensusDecision: node.consensusDecision,
    knownTraitors: [...node.knownTraitors],
    nodeDecisions: JSON.parse(JSON.stringify(node.nodeDecisions)),
  }));
  steps.push(step13);

  // Check success
  const finalStep = { nodes: [], lines: [...initialLines], logs: [], detailedLogs: [], nodeStates: [] };

  let uniformDecision = null;
  let allHonestNodesAgree = true;
  let actionCounts = {attack: 0, retreat: 0};
  let numHonestNodes = 0;

  nodes.forEach(node => {
      if (!node.isTraitor) {
          numHonestNodes++;
          actionCounts[node.action]++;
          if (uniformDecision === null) {
              uniformDecision = node.action;
          } else if (uniformDecision !== node.action) {
              allHonestNodesAgree = false;
          }
      }
  });

  let correctAction = actionCounts.attack > actionCounts.retreat ? 'attack' : 'retreat';

  if (actionCounts.attack === actionCounts.retreat) {
    correctAction = uniformDecision;
  }

  let numHonestNodesWithCorrectDecision = nodes.filter(node => !node.isTraitor && node.action === correctAction).length;

  let successMessage = "";

  if (allHonestNodesAgree) {
      successMessage = `Success: Honest nodes made a uniform decision and decided to ${uniformDecision}.`;
  } else {
      successMessage = "Failure: Honest nodes did not make a uniform decision.";
  }

  let accuracyMessage = `Accuracy: ${numHonestNodesWithCorrectDecision} out of ${numHonestNodes} honest nodes made the correct decision (${correctAction}).`;

  finalStep.logs.push(successMessage);
  finalStep.logs.push(accuracyMessage);

  finalStep.nodes = nodes.map(node => ({ id: node.id, color: node.getStateColor(), isTraitor: node.isTraitor }));
  steps.push(finalStep);


  return { steps };
};

export default simulate;