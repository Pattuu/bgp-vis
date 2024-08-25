import Message from './Message';

class Node {
  constructor(id, isTraitor, disruptChance = 0.5, tamperChance = 0.5, messageLossChance = 0.1, defaultAction = null, totalNodes = 5) {
    this.id = id;
    this.isTraitor = isTraitor;
    this.state = 'initial';
    this.action = null;
    this.defaultAction = defaultAction;
    this.receivedInitMessages = [];
    this.receivedMessages = [];
    this.receivedInitForwards = [];
    this.receivedForwards = [];
    this.receivedValidationResults = [];
    this.receivedValidationForwards = [];
    this.receivedProposals = [];
    this.receivedForwardedProposals = [];
    this.tamperedList = [];
    this.discrepancyList = [];
    this.consensusReached = false;
    this.disruptChance = disruptChance;
    this.tamperChance = tamperChance;
    this.messageLossChance = messageLossChance;
    this.acceptedBlock = null;
    this.nodeDecisions = {};
    this.validationResults = [];
    this.knownTraitors = []

    this.proposedAction = null;

    this.proposerMessage = null;

    this.tempTamperedList = [];
    this.tempDiscrepancyList = [];
    this.tempReceivedForwards = [];
    this.tempReceivedMessages = [];
    this.tempKnownTraitors = [];

    for (let i = 0; i < totalNodes; i++) {
      this.nodeDecisions[i] = null;
    }
  }

  getStateColor() {
    switch (this.state) {
      case 'initial':
        return 'blue';
      case 'decided':
        return this.action === 'attack' ? 'lightblue' : 'yellow';
      case 'checking':
        return '#cce410';
      case 'checking2':
        return '#b0c40c';
      case 'solving':
        return 'orange';
      case 'proposer':
        return 'pink';
      case 'validating':
        return 'orange';
      case 'accepted':
        return 'green';
      case 'rejected':
        return 'red';
      case 'finalized':
        return this.action === 'attack' ? 'lightblue' : 'yellow';
      default:
        return 'gray';
    }
  }

  decideInitialAction() {
    if (this.action === null) {
      this.action = Math.random() < 0.5 ? 'attack' : 'retreat';
    }
    this.state = 'decided';
    this.nodeDecisions[this.id] = this.action;
  }

  sendMessage(toNode) {
    if (Math.random() < this.messageLossChance) {
      return null;
    }
    if (Math.random() < this.tamperChance) {
      const action = this.action == 'attack' ? 'retreat' : 'attack';
      const message = new Message(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, this.id, toNode.id, 'action', action, null, true);
      toNode.receiveMessage(message, 1);
      return message;
    }

    const messageAction = this.isTraitor && Math.random() < this.disruptChance 
      ? (Math.random() < 0.5 ? 'attack' : 'retreat')
      : this.action;
    const message = new Message(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, this.id, toNode.id, 'action', messageAction);
    toNode.receiveMessage(message, 1);
    return message;
  }

  checkTypes() {
    for (let i = 0; i < this.knownTraitors.length; i++) {
      console.log(typeof this.knownTraitors[i])
    }
  }

  forwardInitMessages(toNode) {
    if (Math.random() < this.messageLossChance) {
      return null;
    }
    if (Math.random() < this.tamperChance) {
      const messages = this.receivedMessages;
      const message = new Message(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, this.id, toNode.id, 'forward', messages, null, true);
      toNode.receiveMessage(message, 2);
      return message;
    }

    if (this.isTraitor && Math.random() < this.disruptChance) {
      let hasTampered = false;
    
      const tamperIndex = Math.floor(Math.random() * this.receivedMessages.length);
    
      const messages = this.receivedMessages.map((msg, index) => {
        if (index === tamperIndex && !hasTampered) {
          const tamperedAction = msg.action === 'attack' ? 'retreat' : 'attack';
          hasTampered = true;
          return new Message(msg.id, msg.from, msg.to, msg.type, tamperedAction, null, true);
        }
    
        if (Math.random() < this.disruptChance) {
          const tamperedAction = msg.action === 'attack' ? 'retreat' : 'attack';
          hasTampered = true;
          return new Message(msg.id, msg.from, msg.to, msg.type, tamperedAction, null, true);
        }
    
        return msg;
      });
    
      const message = new Message(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, this.id, toNode.id, 'forward', messages, null, false);
      toNode.receiveMessage(message, 2);
      return message;
    }

    const messages = this.receivedMessages.map(msg => {
      return msg;
    });

    const message = new Message(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, this.id, toNode.id, 'forward', messages, null, false);
    toNode.receiveMessage(message, 2);
    return message;
  }

  furtherForwardInit(toNode) {
    if (this.isTraitor) {
      return;
    }
    if (Math.random() < this.messageLossChance) {
      return null;
    }
    if (Math.random() < this.tamperChance) {
      const message = new Message(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, this.id, toNode.id, 'fForward', null, null, true);
      toNode.receiveMessage(message, 4);
      return message;
    }
    const dataToForward = {
      tamperedList: this.isTraitor ? [] : [...this.tamperedList],
      discrepancyList: this.isTraitor ? [] : [...this.discrepancyList],
      knownTraitors: this.isTraitor ? [] : [...this.knownTraitors],
      receivedMessages: this.isTraitor ? [] : [...this.receivedMessages],
      receivedForwards: this.isTraitor ? [] : [...this.receivedForwards]
    };

    const message = new Message(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, this.id, toNode.id, 'fForward', dataToForward, null, false);
    console.log(message);
    toNode.receiveMessage(message, 4);
    return message;
  }

  receiveMessage(message, type = 1) {
    if (message.isTampered || this.knownTraitors.includes(message.from)) {
      if (type == 1) {
        this.receivedInitMessages.push(message);
      } else if (type == 2) {

      } else if (type == 3) {

      } else if (type == 4) {

      }
      return;
    }
    if (type == 1) {
      this.receivedInitMessages.push(message);
      this.receivedMessages.push(message);
      this.nodeDecisions[message.from] = message.action;
    } else if (type == 2) {
      if (this.isTraitor) {
        return;
      }
      let foundTamperedMessage = false;

      this.receivedInitForwards.push(message);
      message.action.forEach(forwardedMessage => {
        if (forwardedMessage.isTampered) {
          foundTamperedMessage = true;
        } else {
          this.receivedForwards.push(forwardedMessage);
        }
      });

      if (foundTamperedMessage) {
        if (!this.knownTraitors.includes(message.from)) {
          this.knownTraitors.push(message.from);
        }

        this.tamperedList.push(message);

      }
    } else if (type == 3) {
      this.validationResults[message.from] = message.action;
    } else if (type == 4) {
      if (this.isTraitor) {
        return;
      }
      console.log(message);

      const tempTamperedList = [];
      const tempDiscrepancyList = [];
      const tempReceivedForwards = [];
      const tempReceivedMessages = [];

      message.action.tamperedList.forEach(tamperedMsgBatch => {
        if (!tamperedMsgBatch.isTampered) {
          tempTamperedList.push(tamperedMsgBatch);
        }
      });

      message.action.discrepancyList.forEach(discrepancyMsg => {
        if (!discrepancyMsg.isTampered) {
          tempDiscrepancyList.push(discrepancyMsg);
        }
      });

      message.action.receivedForwards.forEach(forwardedMsg => {
        if (!forwardedMsg.isTampered) {
          tempReceivedForwards.push(forwardedMsg);
        }
      });

      message.action.receivedMessages.forEach(receivedMsg => {
        if (!receivedMsg.isTampered) {
          tempReceivedMessages.push(receivedMsg);
        }
      });

      this.tempTamperedList = tempTamperedList;
      this.tempDiscrepancyList = tempDiscrepancyList;
      this.tempReceivedForwards = tempReceivedForwards;
      this.tempReceivedMessages = tempReceivedMessages;
      this.tempKnownTraitors = message.action.knownTraitors;
      console.log(this.tempTamperedList);
      console.log(this.tempDiscrepancyList);
    }
  }

  processForwardedMessages() {
    if (this.isTraitor) {
      return;
    }

    const allMessages = [...this.receivedMessages, ...this.receivedForwards];
    const senderMessageMap = {};

    allMessages.forEach(message => {
      if (!senderMessageMap[message.from]) {
        senderMessageMap[message.from] = [];
      }
      senderMessageMap[message.from].push(message);
    });

    for (const sender in senderMessageMap) {
      const senderId = Number(sender);
      const actions = senderMessageMap[sender].map(msg => msg.action);
      const uniqueActions = new Set(actions);

      if (uniqueActions.size > 1) {
        if (!this.knownTraitors.includes(senderId)) {
          this.knownTraitors.push(senderId);
        }

        this.discrepancyList.push(...senderMessageMap[sender]);
      }
    }

    this.receivedMessages = this.receivedMessages.filter(msg => !this.knownTraitors.includes(msg.from));
    this.receivedForwards = this.receivedForwards.filter(msg => !this.knownTraitors.includes(msg.from));
    

    this.receivedForwards.forEach(message => {
      if (this.nodeDecisions[message.from] === null || this.nodeDecisions[message.from] === undefined) {
        this.nodeDecisions[message.from] = message.action;
      }
    });

    Object.keys(this.nodeDecisions).forEach(nodeId => {
      if (this.knownTraitors.includes(parseInt(nodeId))) {
        delete this.nodeDecisions[nodeId];
      }
    });
  }

  mergeListsWithoutDuplicates(targetList, sourceList) {
    sourceList.forEach(item => {
      const exists = targetList.some(existingItem => existingItem.id === item.id);
      if (!exists) {
        targetList.push(item);
      }
    });
  }

  processFurtherForwards() {
    if (this.isTraitor) {
      return;
    }

    this.tempTamperedList.forEach(mainMessage => {
      if (!this.knownTraitors.includes(mainMessage.from)) {
        this.knownTraitors.push(mainMessage.from);
      }
    });

    this.tempDiscrepancyList.forEach(discrepancyMessage => {
      if (!this.knownTraitors.includes(discrepancyMessage.from)) {
        this.knownTraitors.push(discrepancyMessage.from);
      }
    });

    const allValidMessages = [...this.receivedForwards, ...this.tempReceivedForwards];
    const senderMessageMap = {};

    allValidMessages.forEach(message => {
      if (!senderMessageMap[message.from]) {
        senderMessageMap[message.from] = [];
      }
      senderMessageMap[message.from].push(message);
    });

    for (const sender in senderMessageMap) {
      const senderId = Number(sender);
      const actions = senderMessageMap[sender].map(msg => msg.action);
      const uniqueActions = new Set(actions);

      if (uniqueActions.size > 1) {
        if (!this.knownTraitors.includes(senderId)) {
          this.knownTraitors.push(senderId);
        }
        
        this.discrepancyList.push(...senderMessageMap[sender]);
      }
    }

    allValidMessages.forEach(message => {
      if (!this.knownTraitors.includes(message.from) && this.nodeDecisions[message.from] === null) {
        this.nodeDecisions[message.from] = message.action;
      }
    });

    Object.keys(this.nodeDecisions).forEach(nodeId => {
      if (this.knownTraitors.includes(parseInt(nodeId))) {
        delete this.nodeDecisions[nodeId];
      }
    });

    this.mergeListsWithoutDuplicates(this.tamperedList, this.tempTamperedList);
    this.mergeListsWithoutDuplicates(this.discrepancyList, this.tempDiscrepancyList);
    this.mergeListsWithoutDuplicates(this.receivedForwards, this.tempReceivedForwards);
    this.mergeListsWithoutDuplicates(this.receivedMessages, this.tempReceivedMessages);

    this.receivedForwards = this.receivedForwards.filter(msg => !this.knownTraitors.includes(msg.from));
    this.receivedMessages = this.receivedMessages.filter(msg => !this.knownTraitors.includes(msg.from));
  }

  clearTemps() {
    this.tempTamperedList = [];
    this.tempDiscrepancyList = [];
    this.tempReceivedForwards = [];
    this.tempReceivedMessages = [];
    this.tempKnownTraitors = [];
  }

  determineProposedAction() {
    this.state = 'proposer';
    const actionCounts = { attack: 0, retreat: 0 };
    Object.keys(this.nodeDecisions).forEach(nodeId => {
      const decision = this.nodeDecisions[nodeId];
      if (decision !== null) {
        actionCounts[decision]++;
      } else {
        actionCounts[this.defaultAction]++;
      }
    });
    if (this.isTraitor && Math.random() < this.disruptChance) {
      let action = actionCounts.attack > actionCounts.retreat ? 'retreat' : 'attack';
      this.action = action;
      this.proposedAction = action;
      this.validationResults[this.id] = 'accepted';
      return action;
    }
    let action = actionCounts.attack > actionCounts.retreat ? 'attack' : 'retreat';
    this.action = action;
    this.proposedAction = action;
    this.validationResults[this.id] = 'accepted';
    return action;
  }

  determineAction() {
    const actionCounts = { attack: 0, retreat: 0 };
    Object.keys(this.nodeDecisions).forEach(nodeId => {
      const decision = this.nodeDecisions[nodeId];
      if (decision !== null) {
        actionCounts[decision]++;
      } else {
        actionCounts[this.defaultAction]++;
      }
    });
    return actionCounts.attack > actionCounts.retreat ? 'attack' : 'retreat';
  }

  proposeAction(toNode) {
    if (Math.random() < this.messageLossChance) {
      return null;
    }
    if (Math.random() < this.tamperChance) {
      const message = new Message(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, this.id, toNode, 'propose', this.proposedAction, null, true);
      toNode.receiveProposedAction(message);
      this.proposerMessage = message;
      return message;
    }
    const message = new Message(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, this.id, toNode, 'propose', this.proposedAction, null, false);
    toNode.receiveProposedAction(message);
    this.proposerMessage = message;
    return message;
  }

  forwardProposedAction(toNode) {
    if (this.proposedAction === null || this.proposerMessage === null) {
      return;
    }
    if (Math.random() < this.messageLossChance) {
      return null;
    }
    if (Math.random() < this.tamperChance) {
      const message = new Message(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, this.id, toNode, 'ForwardPropose', this.proposerMessage, null, true);
      toNode.receiveForwardedProposal(message);
      return message;
    }
    if (typeof this.proposerMessage !== 'undefined' || this.proposerMessage !== null) {
      const message = new Message(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, this.id, toNode, 'propose', this.proposerMessage, null, false);
      toNode.receiveForwardedProposal(message);
      return message;
    }
  }

  receiveProposedAction(message) {
    if (message.isTampered || this.knownTraitors.includes(message.from)) {
      return;
    }

    if (this.proposedAction === null) {
      let proposedAction = message.proposedAction;
      let isAccepted = this.determineAction() === proposedAction ? true : false;
      if (isAccepted) {
        this.state = 'accepted';
        this.action = proposedAction;
        this.validationResults[this.id] = 'accepted';
      } else {
        this.state = 'rejected';
        this.action = proposedAction;
        this.validationResults[this.id] = 'accepted';
      }
    }
  }

  receiveForwardedProposal(message) {
    if (message.isTampered || this.knownTraitors.includes(message.from)) {
      return;
    }

    if (message && message.originalMessage?.isTampered) {
      this.receivedProposals.push(message);
      if (!this.knownTraitors.includes(message.from)) {
        this.knownTraitors.push(message.from);
      }
    }

    this.receivedForwardedProposals.push(message);


  }

  finalizeAction(block) {
    const actionCounts = { attack: 0, retreat: 0 };
    Object.values(block.nodeDecisions).forEach(decision => {
      if (decision !== null) {
        actionCounts[decision]++;
      }
    });
    this.action = actionCounts.attack > actionCounts.retreat ? 'attack' : 'retreat';
    this.state = 'finalized';
  }
}

export default Node;