import { RedisCacheProvider } from "./implementations/RedisCacheProvider.js";

const cacheProvider = new RedisCacheProvider();

export { cacheProvider };