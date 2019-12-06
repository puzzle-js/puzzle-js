import { expect } from 'chai';
import { lorem } from 'faker';
import sinon from 'sinon';
import { Platform } from '../src/enums';
import { $configuration } from '../src/configuration';

const { word } = lorem;
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

  describe('when value does not exist in sentry configuration', () => {
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

  describe('when value exists in sentry configuration', () => {
    it('should return value from sentry configuration', async () => {
      // Arrange
      const storefrontName = 'tr';

      // Act
      await $configuration.setup(Platform.Storefront, storefrontName);
      const envVar = $configuration.get('sefa');

      // Assert
      expect(envVar.boolean).to.be.eq(false);
    });
  });
});