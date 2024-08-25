class Message {
    constructor(id, from, to, type, action = null, block = null, isTampered = false, messages = null) {
      this.id = id;
      this.from = from;
      this.to = to;
      this.type = type;
      this.action = action;
      this.block = block;
      this.messages = messages;
      this.isTampered = isTampered;
    }
  }
  
  export default Message;