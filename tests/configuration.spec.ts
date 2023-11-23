import { expect } from 'chai';
import { lorem, random } from 'faker';
import sinon from 'sinon';
import { Platform } from '../src/enums';
import { $configuration, CastedObject } from '../src/configuration';

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

    // Act
    await $configuration.setup(Platform.Storefront, storefrontName);

    //Assert
    expect($configuration.getInstance()).to.be.instanceof($configuration);
  });

  it('setup should create instance once', async () => {
    // Arrange
    const storefrontName = 'tr';
    const envVar = word();
    process.env.envVar = envVar;

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

  describe('when value does not exist in configuration', () => {
    it('should return value from process environment', async () => {
      // Arrange
      const storefrontName = 'tr';
      process.env.CUSTOM_ENV_VAR = word();

      // Act
      await $configuration.setup(Platform.Storefront, storefrontName);
      const envVar = $configuration.get('CUSTOM_ENV_VAR');

      // Assert
      expect(envVar.string).to.be.eq(process.env.CUSTOM_ENV_VAR);
    });
  });

  describe('when value exists in configuration', () => {
    it('should return value when value is boolean', async () => {
      // Arrange
      const storefrontName = 'tr';
      const envKey = word();
      const envValue = boolean();

      // Act
      await $configuration.setup(Platform.Storefront, storefrontName);
      ($configuration as any).instance.processEnv = new Map([[envKey, new CastedObject(envValue)]]);
      const envVar = $configuration.get(envKey);

      // Assert
      expect(envVar.boolean).to.be.eq(envValue);
    });

    it('should return value when envValue is 1', async () => {
      // Arrange
      const storefrontName = 'tr';
      const envKey = word();
      const envValue = 1;

      // Act
      await $configuration.setup(Platform.Storefront, storefrontName);
      ($configuration as any).instance.processEnv = new Map([[envKey, new CastedObject(envValue)]]);
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

      // Act
      await $configuration.setup(Platform.Storefront, storefrontName);
      ($configuration as any).instance.processEnv = new Map([[envKey, new CastedObject(envValue)]]);
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

      // Act
      await $configuration.setup(Platform.Storefront, storefrontName);
      ($configuration as any).instance.processEnv = new Map([[envKey, new CastedObject(envValue)]]);
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

      // Act
      await $configuration.setup(Platform.Storefront, storefrontName);
      ($configuration as any).instance.processEnv = new Map([[envKey, new CastedObject(envValue)]]);
      const envVar = $configuration.get(envKey);

      // Assert
      expect(envVar.boolean).to.be.eq(false);
      expect(envVar.string).to.be.eq(envValue);
    });
  });

  it('should return CastedObject with undefined values', async () => {
    // Arrange
    const storefrontName = 'tr';

    // Act
    await $configuration.setup(Platform.Storefront, storefrontName);
    const envVar = $configuration.get(word());

    // Assert
    expect(envVar.boolean).to.be.eq(undefined);
    expect(envVar.string).to.be.eq(undefined);
    expect(envVar.number).to.be.eq(undefined);
  });
});
