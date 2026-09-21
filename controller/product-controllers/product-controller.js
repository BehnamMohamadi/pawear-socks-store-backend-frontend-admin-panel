const path = require("path");
const fs = require("fs/promises");

const catalogImage = require("../../utils/catalog-image");

const Product = require("../../models/product-models/product-model");



const { ApiFeatures } = require("../../utils/api-features");


const { AppError } = require("../../utils/app-error");

const { catchAsync } = require("../../utils/catch-async");

const PRODUCT_IMAGES_DIRECTORY = path.join(
  __dirname,
  "../../public/images/models-images/product-images/product-images",
);

const DEFAULT_COVER_IMAGE =
  "/images/product-placeholder.svg";

const DEFAULT_GALLERY_IMAGE =
  "/images/product-placeholder.svg";

const getImageFilePath = (imagePath) => {
  return path.join(__dirname, "../../public", imagePath.replace(/^\/+/, ""));
};

const deleteFileIfExists = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
};

const getAllProducts = catchAsync(async (req, res) => {
  const baseFilter = {
    isActive: true,
  };

  const features = new ApiFeatures(Product.find(baseFilter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query
    .populate("category", "name slug icon")
    .populate("subCategory", "name slug icon");

  const total = await Product.countDocuments({
    ...baseFilter,
    ...features.filterObject,
  });

  res.status(200).json({
    status: "success",

    results: products.length,

    pagination: {
      page: features.page,
      limit: features.limit,
      total,

      pages: Math.ceil(total / features.limit),
    },

    data: {
      products,
    },
  });
});

const getProductById = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({
    _id: req.params.productId,

    isActive: true,
  })
    .populate("category", "name slug icon")
    .populate("subCategory", "name slug icon");

  if (!product) {
    return next(new AppError(404, "product not found"));
  }

  res.status(200).json({
    status: "success",

    data: {
      product,
    },
  });
});

const getProductBySlug = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({
    slug: req.params.slug,

    isActive: true,
  })
    .populate("category", "name slug icon")
    .populate("subCategory", "name slug icon");

  if (!product) {
    return next(new AppError(404, "product not found"));
  }

  res.status(200).json({
    status: "success",

    data: {
      product,
    },
  });
});

const updateProductCover = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError(400, "product cover image is required"));
  }

  const product = await Product.findById(req.params.productId);

  if (!product) {
    return next(new AppError(404, "product not found"));
  }

  await fs.mkdir(PRODUCT_IMAGES_DIRECTORY, {
    recursive: true,
  });

  const fileName = `product-cover-${product._id}-${Date.now()}.webp`;

  const outputPath = path.join(PRODUCT_IMAGES_DIRECTORY, fileName);

  await catalogImage(req.file.buffer)
    .toFile(outputPath);

  const oldCover = product.coverImage;

  product.coverImage = `/images/models-images/product-images/product-images/${fileName}`;

  try {
    await product.save();
  } catch (err) {
    await deleteFileIfExists(outputPath);

    throw err;
  }

  if (oldCover && oldCover !== DEFAULT_COVER_IMAGE) {
    await deleteFileIfExists(getImageFilePath(oldCover));
  }

  res.status(200).json({
    status: "success",

    data: {
      product,
    },
  });
});

const deleteProductCover = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    return next(new AppError(404, "product not found"));
  }

  const oldCover = product.coverImage;

  if (oldCover === DEFAULT_COVER_IMAGE) {
    return res.status(200).json({
      status: "success",

      data: {
        product,
      },
    });
  }

  product.coverImage = DEFAULT_COVER_IMAGE;

  await product.save();

  if (oldCover) {
    await deleteFileIfExists(getImageFilePath(oldCover));
  }

  res.status(200).json({
    status: "success",

    data: {
      product,
    },
  });
});

const uploadProductImages = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError(400, "at least one product image is required"));
  }

  const product = await Product.findById(req.params.productId);

  if (!product) {
    return next(new AppError(404, "product not found"));
  }

  await fs.mkdir(PRODUCT_IMAGES_DIRECTORY, {
    recursive: true,
  });

  if (product.images.filter(i => i !== DEFAULT_GALLERY_IMAGE).length + req.files.length > 10) throw new AppError(400, "حداکثر ۱۰ تصویر مجاز است.");
  const uploadedImages = [];

  const createdFiles = [];

  try {
    for (let index = 0; index < req.files.length; index += 1) {
      const fileName = `product-${product._id}-${Date.now()}-${index}.webp`;

      const outputPath = path.join(PRODUCT_IMAGES_DIRECTORY, fileName);

      await catalogImage(req.files[index].buffer)
        .toFile(outputPath);

      createdFiles.push(outputPath);

      uploadedImages.push(
        `/images/models-images/product-images/product-images/${fileName}`,
      );
    }

    const currentImages = product.images.filter(
      (image) => image !== DEFAULT_GALLERY_IMAGE,
    );

    product.images = [...currentImages, ...uploadedImages];

    await product.save();
  } catch (err) {
    await Promise.all(createdFiles.map((file) => deleteFileIfExists(file)));

    throw err;
  }

  res.status(200).json({
    status: "success",

    data: {
      uploadedImages,

      images: product.images,
    },
  });
});

const replaceProductImages = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    return next(new AppError(404, "product not found"));
  }

  await fs.mkdir(PRODUCT_IMAGES_DIRECTORY, {
    recursive: true,
  });

  const oldImages = product.images.filter((image) => image !== DEFAULT_GALLERY_IMAGE);

  const newImages = [];
  const createdFiles = [];

  try {
    if (req.files && req.files.length > 0) {
      for (let index = 0; index < req.files.length; index += 1) {
        const fileName = `product-${product._id}-${Date.now()}-${index}.webp`;

        const outputPath = path.join(PRODUCT_IMAGES_DIRECTORY, fileName);

        await catalogImage(req.files[index].buffer)
          .toFile(outputPath);

        createdFiles.push(outputPath);

        newImages.push(`/images/models-images/product-images/product-images/${fileName}`);
      }
    }

    product.images = newImages.length > 0 ? newImages : [DEFAULT_GALLERY_IMAGE];

    await product.save();
  } catch (err) {
    await Promise.all(createdFiles.map((file) => deleteFileIfExists(file)));

    throw err;
  }

  /*
   * DB successfully updated.
   * Now old physical files can be removed.
   */
  await Promise.all(
    oldImages.map((image) => deleteFileIfExists(getImageFilePath(image))),
  );

  res.status(200).json({
    status: "success",

    data: {
      images: product.images,
    },
  });
});

const deleteProductById = catchAsync(async (req, res, next) => {
 const product = await Product.findByIdAndUpdate(req.params.productId, { $set: { isActive: false } }, { returnDocument: 'after' });
 if (!product) return next(new AppError(404, 'محصول پیدا نشد.'));
 res.status(204).send();
});

module.exports = {
  getAllProducts,
  getProductById,
  getProductBySlug,

  deleteProductById,

  updateProductCover,
  deleteProductCover,

  uploadProductImages,
  replaceProductImages,
};
