import { expect } from 'chai';
import { lorem } from 'faker';
import { Platform } from '../src/enums';
import { Configuration } from '../src/configuration';

const { word } = lorem;

describe('Configuration', () => {
  describe('init', () => {
    it('should return proxy object', async () => {
      // Arrange
      const storefrontName = 'tr';
      const envVar = word();
      process.env.envVar = envVar;

      // Act
      const configuration = new Configuration(Platform.Storefront, storefrontName);
      const c = await configuration.get();

      //Assert
      expect(c.sefa).to.be.eq(false);
      expect(c.envVar).to.be.eq(envVar);
    });
  });
});