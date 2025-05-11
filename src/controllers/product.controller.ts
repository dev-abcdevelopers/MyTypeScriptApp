import { Request, Response } from 'express';
import Product from '../models/product.model';
import redis from '../config/redis';

const CACHE_KEY_ALL_PRODUCTS = 'products:all';
const CACHE_TTL = Number(process.env.REDIS_CACHE_TTL) || 60;

export const addProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.create(req.body);
    await redis.del(CACHE_KEY_ALL_PRODUCTS);
    return res.status(201).json({
      status: true,
      message: 'Product created',
      data: product,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: 'Failed to create product',
      error: err,
    });
  }
};

export const getAllProducts = async (_req: Request, res: Response) => {
  try {
    const cached = await redis.get(CACHE_KEY_ALL_PRODUCTS);
    if (cached) {
      return res.status(200).json({
        status: true,
        message: 'Products fetched from cache',
        data: JSON.parse(cached),
      });
    }

    const products = await Product.findAll();
    await redis.setex(CACHE_KEY_ALL_PRODUCTS, CACHE_TTL, JSON.stringify(products));

    return res.status(200).json({
      status: true,
      message: 'Products fetched from database',
      data: products,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch products',
      data: {},
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        status: false,
        message: 'Product not found',
        data: {},
      });
    }

    await product.update(req.body);
    await redis.del(CACHE_KEY_ALL_PRODUCTS);

    return res.status(200).json({
      status: true,
      message: 'Product updated',
      data: product,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: 'Failed to update product',
      data: {},
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        status: false,
        message: 'Product not found',
        data: {},
      });
    }

    await product.destroy();
    await redis.del(CACHE_KEY_ALL_PRODUCTS);

    return res.status(200).json({
      status: true,
      message: 'Product deleted',
      data: {},
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: 'Failed to delete product',
      data: {},
    });
  }
};
