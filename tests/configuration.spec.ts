import { expect } from 'chai';
import { lorem, random } from 'faker';
import sinon from 'sinon';
import { Platform } from '../src/enums';
import { $configuration, CastedObject } from '../src/configuration';
import { SentrySocket } from '../src/socket';

const { word } = lorem;
const { boolean } = random;
const sandbox = sinon.createSandbox();

describe('Configuration', () => {
  beforeEach(() => {
    $configuration.clearInstance();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('setup should create instance', async () => {
    // Arrange
    const storefrontName = 'tr';
    const envVar = word();
    process.env.envVar = envVar;
    sandbox.stub(SentrySocket.prototype, 'connect').callsArgWith(0, true);
    sandbox.stub($configuration.prototype as any, 'getSentryData').callsArg(0);

    // Act
    await $configuration.setup(Platform.Storefront, storefrontName);

    //Assert
    expect($configuration.getInstance()).to.be.instanceof($configuration);
  });

  it('setup should create instance and not check if sentry is connected', async () => {
    // Arrange
    const storefrontName = 'tr';
    const envVar = word();
    process.env.envVar = envVar;
    sandbox.stub($configuration.prototype as any, 'getSentryData').callsArg(0);

    // Act
    await $configuration.setup(Platform.Storefront, storefrontName, false);

    //Assert
    expect($configuration.getInstance()).to.be.instanceof($configuration);
  });

  it('setup should create instance once', async () => {
    // Arrange
    const storefrontName = 'tr';
    const envVar = word();
    process.env.envVar = envVar;
    sandbox.stub(SentrySocket.prototype, 'connect').callsArgWith(0, true);
    sandbox.stub($configuration.prototype as any, 'getSentryData').callsArg(0);

    // Act
    await $configuration.setup(Platform.Storefront, storefrontName);
    await $configuration.setup(Platform.Gateway, word());

    //Assert
    expect($configuration.getInstance()).to.be.instanceof($configuration);
    expect($configuration.getName()).to.be.eq(storefrontName);
    expect($configuration.getPlatform()).to.be.eq(Platform.Storefront);
  });

  it('should throw Error when get is called without setup', () => {
    // Assert
    expect($configuration.get).to.throw();
  });

  describe('when value does not exist in sentry configuration', () => {
    it('should return value from process environment', async () => {
      // Arrange
      const storefrontName = 'tr';
      process.env.CUSTOM_ENV_VAR = word();
      sandbox.stub(SentrySocket.prototype, 'connect').callsArgWith(0, true);
      sandbox.stub($configuration.prototype as any, 'getSentryData').callsArg(0);

      // Act
      await $configuration.setup(Platform.Storefront, storefrontName);
      const envVar = $configuration.get('CUSTOM_ENV_VAR');

      // Assert
      expect(envVar.string).to.be.eq(process.env.CUSTOM_ENV_VAR);
    });
  });

  describe('when value exists in sentry configuration', () => {
    it('should return value when value is boolean', async () => {
      // Arrange
      const storefrontName = 'tr';
      const envKey = word();
      const envValue = boolean();
      sandbox.stub(SentrySocket.prototype, 'connect').callsArgWith(0, true);
      sandbox.stub($configuration.prototype as any, 'getSentryData').callsArg(0);

      // Act
      await $configuration.setup(Platform.Storefront, storefrontName);
      ($configuration as any).instance.sentryEnv = new Map([[envKey, new CastedObject(envValue)]]);
      const envVar = $configuration.get(envKey);

      // Assert
      expect(envVar.boolean).to.be.eq(envValue);
    });

    it('should return value when envValue is 1', async () => {
      // Arrange
      const storefrontName = 'tr';
      const envKey = word();
      const envValue = 1;
      sandbox.stub(SentrySocket.prototype, 'connect').callsArgWith(0, true);
      sandbox.stub($configuration.prototype as any, 'getSentryData').callsArg(0);

      // Act
      await $configuration.setup(Platform.Storefront, storefrontName);
      ($configuration as any).instance.sentryEnv = new Map([[envKey, new CastedObject(envValue)]]);
      const envVar = $configuration.get(envKey);

      // Assert
      expect(envVar.boolean).to.be.eq(true);
      expect(envVar.string).to.be.eq('1');
      expect(envVar.number).to.be.eq(1);
    });

    it('should return value when envValue is 0', async () => {
      // Arrange
      const storefrontName = 'tr';
      const envKey = word();
      const envValue = 0;
      sandbox.stub(SentrySocket.prototype, 'connect').callsArgWith(0, true);
      sandbox.stub($configuration.prototype as any, 'getSentryData').callsArg(0);

      // Act
      await $configuration.setup(Platform.Storefront, storefrontName);
      ($configuration as any).instance.sentryEnv = new Map([[envKey, new CastedObject(envValue)]]);
      const envVar = $configuration.get(envKey);

      // Assert
      expect(envVar.boolean).to.be.eq(false);
      expect(envVar.string).to.be.eq('0');
      expect(envVar.number).to.be.eq(0);
    });

    it('should return value when envValue is word', async () => {
      // Arrange
      const storefrontName = 'tr';
      const envKey = word();
      const envValue = word();
      sandbox.stub(SentrySocket.prototype, 'connect').callsArgWith(0, true);
      sandbox.stub($configuration.prototype as any, 'getSentryData').callsArg(0);

      // Act
      await $configuration.setup(Platform.Storefront, storefrontName);
      ($configuration as any).instance.sentryEnv = new Map([[envKey, new CastedObject(envValue)]]);
      const envVar = $configuration.get(envKey);

      // Assert
      expect(envVar.boolean).to.be.eq(Boolean(envValue));
      expect(envVar.string).to.be.eq(envValue);
    });

    it('should return value when envValue is string false', async () => {
      // Arrange
      const storefrontName = 'tr';
      const envKey = word();
      const envValue = 'false';
      sandbox.stub(SentrySocket.prototype, 'connect').callsArgWith(0, true);
      sandbox.stub($configuration.prototype as any, 'getSentryData').callsArg(0);

      // Act
      await $configuration.setup(Platform.Storefront, storefrontName);
      ($configuration as any).instance.sentryEnv = new Map([[envKey, new CastedObject(envValue)]]);
      const envVar = $configuration.get(envKey);

      // Assert
      expect(envVar.boolean).to.be.eq(false);
      expect(envVar.string).to.be.eq(envValue);
    });
  });

  it('shoud return CastedObject with undefined values', async () => {
    // Arrange
    const storefrontName = 'tr';
    sandbox.stub(SentrySocket.prototype, 'connect').callsArgWith(0, true);
    sandbox.stub($configuration.prototype as any, 'getSentryData').callsArg(0);

    // Act
    await $configuration.setup(Platform.Storefront, storefrontName);
    const envVar = $configuration.get(word());

    // Assert
    expect(envVar.boolean).to.be.eq(undefined);
    expect(envVar.string).to.be.eq(undefined);
    expect(envVar.number).to.be.eq(undefined);
  });

  it('should update sentryMap', async () => {
    // Arrange
    const storefrontName = 'tr';
    const updateObject = {
      key1: word(),
      key2: word()
    };
    sandbox.stub(SentrySocket.prototype, 'connect').callsArgWith(0, true);
    sandbox.stub($configuration.prototype as any, 'getSentryData').callsArg(0);

    // Act
    await $configuration.setup(Platform.Storefront, storefrontName);
    ($configuration.getInstance() as any).updateSentryMap(updateObject);

    // Assert
    expect(($configuration.getInstance() as any).sentryEnv).to.be.deep.eq(CastedObject.toMap(updateObject));

  });

  it('should subscribe for sentry config update ', async () => {
    // Arrange
    const gatewayName = 'Browsing';
    sandbox.stub(SentrySocket.prototype, 'connect').callsArgWith(0, true);
    sandbox.stub($configuration.prototype as any, 'getSentryData').callsArg(0);
    const callbackData = {
      key1: word(),
      key2: word(),
    };
    const onStub = sandbox.stub();
    const updateSentryMapStub = sandbox.stub();

    // Act
    await $configuration.setup(Platform.Gateway, gatewayName);
    ($configuration.getInstance() as any).sentrySocket = {
      client: {
        on: onStub.yields(callbackData)
      }
    };
    ($configuration.getInstance() as any).updateSentryMap = updateSentryMapStub;
    ($configuration.getInstance() as any).subscribeForSentryConfigUpdate();

    // Assert
    expect(onStub.called).to.be.eq(true);
    expect(updateSentryMapStub.calledWith(callbackData)).to.be.eq(true);
  });

  it('should not subscribe for sentry config update when received data is not an object ', async () => {
    // Arrange
    const gatewayName = 'Browsing';
    sandbox.stub(SentrySocket.prototype, 'connect').callsArgWith(0, true);
    sandbox.stub($configuration.prototype as any, 'getSentryData').callsArg(0);
    const callbackData = boolean();
    const onStub = sandbox.stub();
    const updateSentryMapStub = sandbox.stub();

    // Act
    await $configuration.setup(Platform.Gateway, gatewayName);
    ($configuration.getInstance() as any).sentrySocket = {
      client: {
        on: onStub.yields(callbackData)
      }
    };
    ($configuration.getInstance() as any).updateSentryMap = updateSentryMapStub;
    ($configuration.getInstance() as any).subscribeForSentryConfigUpdate();

    // Assert
    expect(onStub.calledWith(`configurations.${Platform.Gateway}.${gatewayName}.update`)).to.be.eq(true);
    expect(updateSentryMapStub.calledWith(callbackData)).to.be.eq(false);
  });

  it('should get sentry data, and then update sentry map with the data, and then subscribe for sentry config update', async () => {
    // Arrange
    const gatewayName = 'Browsing';
    sandbox.stub(SentrySocket.prototype, 'connect').callsArgWith(0, true);
    const getSentryStub = sandbox.stub($configuration.prototype as any, 'getSentryData').callsArg(0);
    const callbackData = {
      key1: word(),
      key2: word(),
    };
    const onStub = sandbox.stub();
    const emitStub = sandbox.stub();
    const updateSentryMapStub = sandbox.stub();
    const resolveStub = sandbox.stub();
    const rejectStub = sandbox.stub();

    // Act
    await $configuration.setup(Platform.Gateway, gatewayName);
    getSentryStub.restore();
    ($configuration.getInstance() as any).sentrySocket = {
      client: {
        on: onStub.yields(callbackData),
        emit: emitStub
      }
    };
    ($configuration.getInstance() as any).updateSentryMap = updateSentryMapStub;
    ($configuration.getInstance() as any).getSentryData(resolveStub, rejectStub);

    // Assert
    expect(onStub.calledWith(`configurations.${Platform.Gateway}.${gatewayName}`)).to.be.eq(true);
    expect(resolveStub.called).to.be.eq(true);
    expect(rejectStub.called).to.be.eq(false);
    expect(updateSentryMapStub.calledWith(callbackData)).to.be.eq(true);
    expect(emitStub.calledWith(`configurations.${Platform.Gateway}.get`, { name: gatewayName })).to.be.eq(true);
  });
});