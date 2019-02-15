import {Gateway, PuzzleGateway} from "../lib/gateway";

@PuzzleGateway({
  port: 444,
  api: {
    handlers: []
  },
  fragments: {
    handlers: []
  }
})
class ProductGateway extends Gateway {
  constructor() {
    super();

    console.log('Creating Product Gateway');
  }
}
