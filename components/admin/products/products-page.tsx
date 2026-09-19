'use client';

import {
  useMemo,
  useState,
  useEffect,
  useRef,
  } from 'react';

import type {
  FormEvent,
  } from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
  } from '@tanstack/react-query';

import {
  AlertCircle,
  Boxes,
  Check,
  CirclePlus,
  Edit3,
  Layers3,
  PackageCheck,
  PackageSearch,
  Search,
  Tag,
  ToggleLeft,
  ToggleRight,
  X,
  ImageIcon,
  Star,
  Trash2,
  UploadCloud,
  } from 'lucide-react';

import {
  createCategory,
  createProduct,
  getManagementCategories,
  getManagementProducts,
  updateCategory,
  updateProduct,
  deleteProductImage,
  getProductImages,
  setPrimaryProductImage,
  uploadProductImages,
} from '@/lib/api/products';

import {
  getManagementBranches,
} from '@/lib/api/branches';

import {
  useAuthStore,
} from '@/stores/auth-store';

import type {
  CreateCategoryInput,
  CreateProductInput,
  Product,
  ProductCategory,
  ProductType,
  UpdateCategoryInput,
  UpdateProductInput,
} from '@/types/product';


const productTypeLabels: Record<ProductType, string> = {
  GAS: 'Cooking gas',
  ENGINE_OIL: 'Engine oil',
  BRAKE_OIL: 'Brake oil',
  CYLINDER: 'Cylinder',
  OTHER: 'Other',
};

const productTypeOptions: ProductType[] = [
  'GAS',
  'ENGINE_OIL',
  'BRAKE_OIL',
  'CYLINDER',
  'OTHER',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(value);

const getErrorMessage = (
  error: unknown,
): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: unknown;
          };
        };
      }
    ).response;

    if (
      typeof response?.data?.message ===
      'string'
    ) {
      return response.data.message;
    }
  }

  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};


type Notice = {
  type: 'success' | 'error';
  message: string;
} | null;


function NoticeBanner({
  notice,
  onClose,
}: {
  notice: Notice;
  onClose: () => void;
}) {
  if (!notice) {
    return null;
  }

  return (
    <div
      className={[
        'mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3',
        notice.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-800',
      ].join(' ')}
    >
      {notice.type === 'success' ? (
        <Check className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      )}

      <p className="flex-1 text-sm font-medium">
        {notice.message}
      </p>

      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 transition hover:bg-black/5"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}


function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border border-slate-200 bg-white shadow-2xl sm:max-w-2xl sm:rounded-[28px]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-5 backdrop-blur sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <X className="size-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}


/*
 * STAGE_2B_PRODUCT_MEDIA_UI
 *
 * Media limits intentionally mirror the backend.
 * The backend remains the authoritative validator.
 */
const MAX_PRODUCT_IMAGES = 6;

const MAX_PRODUCT_IMAGE_SIZE =
  5 * 1024 * 1024;

const ACCEPTED_PRODUCT_IMAGE_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);


function ProductForm({
  product,
  categories,
  createBranchId,
  onCancel,
  onSuccess,
}: {
  product: Product | null;
  categories: ProductCategory[];
  createBranchId?: string;
  onCancel: () => void;
  onSuccess: (message: string) => void;
}) {
  const queryClient =
    useQueryClient();

  const previewUrlsRef =
    useRef<Set<string>>(
      new Set(),
    );

  const [name, setName] =
    useState(
      product?.name ??
        '',
    );

  const [
    description,
    setDescription,
  ] =
    useState(
      product?.description ??
        '',
    );

  const [type, setType] =
    useState<ProductType>(
      product?.type ??
        'GAS',
    );

  const [sku, setSku] =
    useState(
      product?.sku ??
        '',
    );

  const [unit, setUnit] =
    useState(
      product?.unit ??
        'kg',
    );

  const [
    pricePerUnit,
    setPricePerUnit,
  ] =
    useState(
      product
        ? String(
            product.pricePerUnit,
          )
        : '',
    );

  const [
    categoryId,
    setCategoryId,
  ] =
    useState(
      product?.categoryId ??
        '',
    );

  const [
    isActive,
    setIsActive,
  ] =
    useState(
      product?.isActive ??
        true,
    );

  const [
    formError,
    setFormError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    existingImages,
    setExistingImages,
  ] =
    useState(
      product?.images ??
        [],
    );

  const [
    pendingImages,
    setPendingImages,
  ] =
    useState<
      Array<{
        id: string;
        file: File;
        previewUrl: string;
      }>
    >([]);


  useEffect(() => {
    const urls =
      previewUrlsRef.current;

    return () => {
      urls.forEach(
        (url) =>
          URL.revokeObjectURL(
            url,
          ),
      );

      urls.clear();
    };
  }, []);


  const totalImageCount =
    existingImages.length +
    pendingImages.length;


  const clearPendingPreviews =
    () => {
      pendingImages.forEach(
        (image) => {
          URL.revokeObjectURL(
            image.previewUrl,
          );

          previewUrlsRef.current.delete(
            image.previewUrl,
          );
        },
      );

      setPendingImages(
        [],
      );
    };


  const invalidateProducts =
    async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'products',
        ],
      });
    };


  const saveMutation =
    useMutation({
      mutationFn:
        async () => {
          const price =
            Number(
              pricePerUnit,
            );

          if (
            !name.trim()
          ) {
            throw new Error(
              'Product name is required.',
            );
          }

          if (
            !sku.trim()
          ) {
            throw new Error(
              'SKU is required.',
            );
          }

          if (
            !unit.trim()
          ) {
            throw new Error(
              'Unit is required.',
            );
          }

          if (
            !Number.isFinite(
              price,
            ) ||
            price <= 0
          ) {
            throw new Error(
              'Price must be greater than zero.',
            );
          }

          if (
            !categoryId
          ) {
            throw new Error(
              'Select a product category.',
            );
          }


          let savedProduct:
            Product;


          if (product) {
            const input:
              UpdateProductInput = {
                name:
                  name.trim(),

                description:
                  description.trim() ||
                  null,

                type,

                sku:
                  sku
                    .trim()
                    .toUpperCase(),

                unit:
                  unit.trim(),

                pricePerUnit:
                  price,

                categoryId,

                isActive,
              };

            savedProduct =
              await updateProduct(
                product.id,
                input,
              );
          }
          else {
            const input:
              CreateProductInput = {
                ...(createBranchId
                  ? {
                      branchId:
                        createBranchId,
                    }
                  : {}),

                name:
                  name.trim(),

                ...(description.trim()
                  ? {
                      description:
                        description.trim(),
                    }
                  : {}),

                type,

                sku:
                  sku
                    .trim()
                    .toUpperCase(),

                unit:
                  unit.trim(),

                pricePerUnit:
                  price,

                categoryId,

                isActive,
              };

            savedProduct =
              await createProduct(
                input,
              );
          }


          let uploadError:
            string | null =
              null;

          let uploadedImages:
            Awaited<
              ReturnType<
                typeof uploadProductImages
              >
            > =
              [];


          if (
            pendingImages.length >
            0
          ) {
            try {
              uploadedImages =
                await uploadProductImages(
                  savedProduct.id,
                  pendingImages.map(
                    (image) =>
                      image.file,
                  ),
                );
            }
            catch (error) {
              uploadError =
                getErrorMessage(
                  error,
                );
            }
          }


          return {
            savedProduct,
            uploadedImages,
            uploadError,
          };
        },


      onSuccess:
        async (
          result,
        ) => {
          await invalidateProducts();

          if (
            result.uploadedImages
              .length >
            0
          ) {
            setExistingImages(
              (current) => [
                ...current,
                ...result
                  .uploadedImages,
              ],
            );
          }

          clearPendingPreviews();

          const action =
            product
              ? 'updated'
              : 'created';

          if (
            result.uploadError
          ) {
            onSuccess(
              `Product ${action} successfully, but image upload failed: ${result.uploadError}. Edit the product to retry the images.`,
            );

            return;
          }

          onSuccess(
            pendingImages.length >
              0
              ? `Product ${action} successfully with product images.`
              : `Product ${action} successfully.`,
          );
        },


      onError:
        (error) => {
          setFormError(
            getErrorMessage(
              error,
            ),
          );
        },
    });


  const primaryMutation =
    useMutation({
      mutationFn:
        async (
          imageId:
            string,
        ) => {
          if (!product) {
            throw new Error(
              'Save the product before changing its primary image.',
            );
          }

          await setPrimaryProductImage(
            product.id,
            imageId,
          );

          return getProductImages(
            product.id,
          );
        },


      onSuccess:
        async (
          images,
        ) => {
          setExistingImages(
            images,
          );

          await invalidateProducts();
        },


      onError:
        (error) => {
          setFormError(
            getErrorMessage(
              error,
            ),
          );
        },
    });


  const deleteImageMutation =
    useMutation({
      mutationFn:
        async (
          imageId:
            string,
        ) => {
          if (!product) {
            throw new Error(
              'Save the product before deleting stored images.',
            );
          }

          await deleteProductImage(
            product.id,
            imageId,
          );

          return getProductImages(
            product.id,
          );
        },


      onSuccess:
        async (
          images,
        ) => {
          setExistingImages(
            images,
          );

          await invalidateProducts();
        },


      onError:
        (error) => {
          setFormError(
            getErrorMessage(
              error,
            ),
          );
        },
    });


  const activeCategories =
    categories.filter(
      (category) => {
        if (
          category.isActive
        ) {
          return true;
        }

        return (
          product?.categoryId ===
          category.id
        );
      },
    );


  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setFormError(
      null,
    );

    saveMutation.mutate();
  };


  const handleFilesSelected = (
    files:
      File[],
  ) => {
    setFormError(
      null,
    );

    if (
      files.length ===
      0
    ) {
      return;
    }


    if (
      totalImageCount +
        files.length >
      MAX_PRODUCT_IMAGES
    ) {
      setFormError(
        `A product can have at most ${MAX_PRODUCT_IMAGES} images. You currently have ${totalImageCount}.`,
      );

      return;
    }


    for (
      const file of files
    ) {
      if (
        !ACCEPTED_PRODUCT_IMAGE_TYPES
          .has(
            file.type,
          )
      ) {
        setFormError(
          `${file.name} is not supported. Use JPEG, PNG or WebP only.`,
        );

        return;
      }


      if (
        file.size >
        MAX_PRODUCT_IMAGE_SIZE
      ) {
        setFormError(
          `${file.name} is larger than 5 MB.`,
        );

        return;
      }
    }


    const nextImages =
      files.map(
        (
          file,
          index,
        ) => {
          const previewUrl =
            URL.createObjectURL(
              file,
            );

          previewUrlsRef.current.add(
            previewUrl,
          );

          return {
            id:
              `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${index}`,

            file,

            previewUrl,
          };
        },
      );


    setPendingImages(
      (current) => [
        ...current,
        ...nextImages,
      ],
    );
  };


  const removePendingImage =
    (
      imageId:
        string,
    ) => {
      setPendingImages(
        (current) => {
          const target =
            current.find(
              (image) =>
                image.id ===
                imageId,
            );

          if (target) {
            URL.revokeObjectURL(
              target.previewUrl,
            );

            previewUrlsRef.current.delete(
              target.previewUrl,
            );
          }

          return current.filter(
            (image) =>
              image.id !==
              imageId,
          );
        },
      );
    };


  const mediaBusy =
    saveMutation.isPending ||
    primaryMutation.isPending ||
    deleteImageMutation.isPending;


  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="p-5 sm:p-6"
    >
      {formError ? (
        <div className="mb-5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />

          <span>
            {formError}
          </span>
        </div>
      ) : null}


      <div className="grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-xs font-semibold text-slate-700">
            Product name
          </span>

          <input
            value={name}
            onChange={(event) =>
              setName(
                event.target.value,
              )
            }
            placeholder="e.g. Cooking Gas"
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </label>


        <label>
          <span className="text-xs font-semibold text-slate-700">
            Type
          </span>

          <select
            value={type}
            onChange={(event) =>
              setType(
                event.target
                  .value as ProductType,
              )
            }
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          >
            {productTypeOptions.map(
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {
                    productTypeLabels[
                      value
                    ]
                  }
                </option>
              ),
            )}
          </select>
        </label>


        <label>
          <span className="text-xs font-semibold text-slate-700">
            Category
          </span>

          <select
            value={
              categoryId
            }
            onChange={(event) =>
              setCategoryId(
                event.target
                  .value,
              )
            }
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          >
            <option value="">
              Select category
            </option>

            {activeCategories.map(
              (category) => (
                <option
                  key={
                    category.id
                  }
                  value={
                    category.id
                  }
                >
                  {
                    category.name
                  }

                  {category.isActive
                    ? ''
                    : ' (Inactive)'}
                </option>
              ),
            )}
          </select>
        </label>


        <label>
          <span className="text-xs font-semibold text-slate-700">
            SKU
          </span>

          <input
            value={sku}
            onChange={(event) =>
              setSku(
                event.target.value
                  .toUpperCase(),
              )
            }
            placeholder="e.g. GAS-KG"
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm uppercase text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </label>


        <label>
          <span className="text-xs font-semibold text-slate-700">
            Unit
          </span>

          <input
            value={unit}
            onChange={(event) =>
              setUnit(
                event.target.value,
              )
            }
            placeholder="kg, litre, item..."
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </label>


        <label>
          <span className="text-xs font-semibold text-slate-700">
            Price per unit
          </span>

          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              ?
            </span>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={
                pricePerUnit
              }
              onChange={(
                event,
              ) =>
                setPricePerUnit(
                  event.target
                    .value,
                )
              }
              placeholder="0.00"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
        </label>


        <label>
          <span className="text-xs font-semibold text-slate-700">
            Status
          </span>

          <button
            type="button"
            onClick={() =>
              setIsActive(
                (current) =>
                  !current,
              )
            }
            className={[
              'mt-2 flex h-11 w-full items-center justify-between rounded-xl border px-3 text-sm font-semibold transition',
              isActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-600',
            ].join(' ')}
          >
            <span>
              {isActive
                ? 'Active'
                : 'Inactive'}
            </span>

            {isActive ? (
              <ToggleRight className="size-5" />
            ) : (
              <ToggleLeft className="size-5" />
            )}
          </button>
        </label>


        <label className="sm:col-span-2">
          <span className="text-xs font-semibold text-slate-700">
            Description
          </span>

          <textarea
            value={
              description
            }
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
            rows={4}
            maxLength={500}
            placeholder="Optional product description"
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </label>
      </div>


      <div className="mt-6 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ImageIcon className="size-4 text-emerald-700" />

              <p className="text-sm font-bold text-slate-900">
                Product images
              </p>
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              JPEG, PNG or WebP.
              Maximum 5 MB each.
              Up to 6 images per
              product.
            </p>
          </div>

          <span className={[
            'w-fit rounded-full px-2.5 py-1 text-[10px] font-bold',
            totalImageCount >=
            MAX_PRODUCT_IMAGES
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700',
          ].join(' ')}>
            {totalImageCount}/
            {MAX_PRODUCT_IMAGES}
          </span>
        </div>


        {existingImages.length >
        0 ? (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Stored images
            </p>

            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {existingImages.map(
                (image) => (
                  <div
                    key={
                      image.id
                    }
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <div className="aspect-square bg-slate-100">
                      <img
                        src={
                          image.url
                        }
                        alt={
                          image.altText ??
                          name ??
                          'Product image'
                        }
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    </div>

                    {image.isPrimary ? (
                      <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-emerald-700 px-2 py-1 text-[9px] font-bold text-white shadow-sm">
                        <Star className="size-3 fill-current" />
                        Primary
                      </div>
                    ) : null}

                    <div className="absolute inset-x-2 bottom-2 flex gap-1.5">
                      {!image.isPrimary ? (
                        <button
                          type="button"
                          disabled={
                            mediaBusy
                          }
                          onClick={() =>
                            primaryMutation.mutate(
                              image.id,
                            )
                          }
                          className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-white/95 px-2 text-[10px] font-bold text-emerald-700 shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-50"
                        >
                          <Star className="size-3" />
                          Primary
                        </button>
                      ) : null}

                      <button
                        type="button"
                        disabled={
                          mediaBusy
                        }
                        onClick={() => {
                          const confirmed =
                            window.confirm(
                              'Delete this product image?',
                            );

                          if (
                            confirmed
                          ) {
                            deleteImageMutation.mutate(
                              image.id,
                            );
                          }
                        }}
                        className="flex h-8 items-center justify-center rounded-lg bg-white/95 px-2.5 text-rose-600 shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-50"
                        aria-label="Delete product image"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        ) : null}


        {pendingImages.length >
        0 ? (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Ready to upload
            </p>

            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pendingImages.map(
                (image) => (
                  <div
                    key={
                      image.id
                    }
                    className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white"
                  >
                    <div className="aspect-square bg-slate-100">
                      <img
                        src={
                          image.previewUrl
                        }
                        alt={
                          image.file.name
                        }
                        className="size-full object-cover"
                      />
                    </div>

                    <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-lg bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur">
                      <p className="min-w-0 flex-1 truncate text-[9px] font-semibold text-slate-600">
                        {
                          image.file
                            .name
                        }
                      </p>

                      <button
                        type="button"
                        disabled={
                          mediaBusy
                        }
                        onClick={() =>
                          removePendingImage(
                            image.id,
                          )
                        }
                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-rose-600 transition hover:bg-rose-50"
                        aria-label="Remove selected image"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        ) : null}


        <label
          className={[
            'mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition',
            totalImageCount >=
              MAX_PRODUCT_IMAGES ||
            mediaBusy
              ? 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-60'
              : 'border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/50',
          ].join(' ')}
        >
          <UploadCloud className="size-6 text-emerald-700" />

          <p className="mt-2 text-xs font-bold text-slate-800">
            Choose product images
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Select one or several
            images from this device.
          </p>

          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={
              totalImageCount >=
                MAX_PRODUCT_IMAGES ||
              mediaBusy
            }
            onChange={(event) => {
              const files =
                Array.from(
                  event.target
                    .files ??
                    [],
                );

              event.currentTarget.value =
                '';

              handleFilesSelected(
                files,
              );
            }}
            className="sr-only"
          />
        </label>


        {!product &&
        pendingImages.length >
          0 ? (
          <p className="mt-3 text-[11px] leading-5 text-slate-500">
            The product record will
            be created first, then the
            selected files will be
            uploaded securely.
          </p>
        ) : null}
      </div>


      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={
            onCancel
          }
          disabled={
            mediaBusy
          }
          className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            mediaBusy
          }
          className="h-11 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveMutation.isPending
            ? pendingImages.length >
              0
              ? 'Saving & uploading...'
              : 'Saving...'
            : product
              ? pendingImages.length >
                0
                ? 'Save & upload'
                : 'Save changes'
              : pendingImages.length >
                  0
                ? 'Create & upload'
                : 'Create product'}
        </button>
      </div>
    </form>
  );
}


function CategoryForm({
  category,
  createBranchId,
  onCancel,
  onSuccess,
}: {
  category: ProductCategory | null;
  createBranchId?: string;
  onCancel: () => void;
  onSuccess: (message: string) => void;
}) {
  const queryClient = useQueryClient();

  const [name, setName] =
    useState(category?.name ?? '');

  const [description, setDescription] =
    useState(category?.description ?? '');

  const [isActive, setIsActive] =
    useState(category?.isActive ?? true);

  const [formError, setFormError] =
    useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (
        name.trim().length < 2
      ) {
        throw new Error(
          'Category name must contain at least 2 characters.',
        );
      }

      if (category) {
        const input: UpdateCategoryInput = {
          name: name.trim(),
          description:
            description.trim() || null,
          isActive,
        };

        return updateCategory(
          category.id,
          input,
        );
      }

      const input: CreateCategoryInput = {
        ...(createBranchId
          ? {
              branchId:
                createBranchId,
            }
          : {}),

        name: name.trim(),
        ...(description.trim()
          ? {
              description:
                description.trim(),
            }
          : {}),
      };

      return createCategory(input);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          'admin',
          'product-categories',
        ],
      });

      onSuccess(
        category
          ? 'Category updated successfully.'
          : 'Category created successfully.',
      );
    },

    onError: (error) => {
      setFormError(
        getErrorMessage(error),
      );
    },
  });

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFormError(null);
    saveMutation.mutate();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 sm:p-6"
    >
      {formError ? (
        <div className="mb-5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      ) : null}

      <div className="grid gap-5">
        <label>
          <span className="text-xs font-semibold text-slate-700">
            Category name
          </span>

          <input
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            maxLength={100}
            placeholder="e.g. Cooking Gas"
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </label>

        <label>
          <span className="text-xs font-semibold text-slate-700">
            Description
          </span>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
            rows={4}
            maxLength={500}
            placeholder="Optional category description"
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </label>

        {category ? (
          <label>
            <span className="text-xs font-semibold text-slate-700">
              Status
            </span>

            <button
              type="button"
              onClick={() =>
                setIsActive(
                  (current) => !current,
                )
              }
              className={[
                'mt-2 flex h-11 w-full items-center justify-between rounded-xl border px-3 text-sm font-semibold transition',
                isActive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600',
              ].join(' ')}
            >
              <span>
                {isActive
                  ? 'Active category'
                  : 'Inactive category'}
              </span>

              {isActive ? (
                <ToggleRight className="size-5" />
              ) : (
                <ToggleLeft className="size-5" />
              )}
            </button>

            <p className="mt-2 text-[11px] leading-5 text-slate-400">
              A category containing active
              products cannot be deactivated.
            </p>
          </label>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saveMutation.isPending}
          className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="h-11 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {saveMutation.isPending
            ? 'Saving…'
            : category
              ? 'Save category'
              : 'Create category'}
        </button>
      </div>
    </form>
  );
}


function ProductRow({
  product,
  onEdit,
  onToggle,
  togglePending,
}: {
  product: Product;
  onEdit: () => void;
  onToggle: () => void;
  togglePending: boolean;
}) {
  const primaryImage =
    product.images.find(
      (image) =>
        image.isPrimary,
    ) ??
    product.images[0] ??
    null;


  return (
    <div className="grid gap-4 border-b border-slate-100 px-5 py-4 transition hover:bg-emerald-50/30 xl:grid-cols-[minmax(260px,1.5fr)_minmax(130px,.8fr)_minmax(130px,.8fr)_minmax(140px,.8fr)_150px] xl:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {primaryImage ? (
            <img
              src={
                primaryImage.url
              }
              alt={
                primaryImage.altText ??
                product.name
              }
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon className="size-5 text-slate-300" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {product.name}
            </p>

            <span
              className={[
                'rounded-full px-2 py-0.5 text-[10px] font-bold',
                product.isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500',
              ].join(' ')}
            >
              {product.isActive
                ? 'ACTIVE'
                : 'INACTIVE'}
            </span>
          </div>

          <p className="mt-1 truncate text-xs text-slate-400">
            SKU {product.sku} ?{' '}
            {product.branch.name}
          </p>

          <p className="mt-0.5 text-[10px] text-slate-400">
            {product.images.length}{' '}
            image
            {product.images.length ===
            1
              ? ''
              : 's'}
          </p>
        </div>
      </div>


      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 xl:hidden">
          Category
        </p>

        <p className="mt-1 text-sm text-slate-700 xl:mt-0">
          {
            product.category
              .name
          }
        </p>
      </div>


      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 xl:hidden">
          Type
        </p>

        <p className="mt-1 text-sm text-slate-700 xl:mt-0">
          {
            productTypeLabels[
              product.type
            ]
          }
        </p>
      </div>


      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 xl:hidden">
          Price
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-900 xl:mt-0">
          {formatCurrency(
            product.pricePerUnit,
          )}
        </p>

        <p className="text-[11px] text-slate-400">
          per {product.unit}
        </p>
      </div>


      <div className="flex gap-2 xl:justify-end">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <Edit3 className="size-3.5" />
          Edit
        </button>

        <button
          type="button"
          disabled={
            togglePending
          }
          onClick={
            onToggle
          }
          className={[
            'flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition disabled:opacity-50',
            product.isActive
              ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
          ].join(' ')}
        >
          {product.isActive ? (
            <ToggleLeft className="size-3.5" />
          ) : (
            <ToggleRight className="size-3.5" />
          )}

          {product.isActive
            ? 'Deactivate'
            : 'Activate'}
        </button>
      </div>
    </div>
  );
}


export function ProductsPage() {
  const queryClient =
    useQueryClient();

  const user =
    useAuthStore(
      (state) => state.user,
    );

  const isSuperAdmin =
    user?.role ===
    'SUPER_ADMIN';

  const managedBranch =
    user?.managedBranch ??
    null;

  const [search, setSearch] =
    useState('');

  const [notice, setNotice] =
    useState<Notice>(null);

  const [
    selectedBranchId,
    setSelectedBranchId,
  ] = useState('');

  const [
    productEditorOpen,
    setProductEditorOpen,
  ] = useState(false);

  const [
    categoryEditorOpen,
    setCategoryEditorOpen,
  ] = useState(false);

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState<Product | null>(
    null,
  );

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<ProductCategory | null>(
    null,
  );

  const branchesQuery =
    useQuery({
      queryKey: [
        'admin',
        'branches',
        'management',
        'catalogue-scope',
      ],

      queryFn:
        getManagementBranches,

      enabled:
        isSuperAdmin,
    });

  const branches =
    branchesQuery.data ??
    [];

  const selectedScopeBranch =
    branches.find(
      (branch) =>
        branch.id ===
        selectedBranchId,
    ) ??
    null;

  const effectiveBranchId =
    isSuperAdmin
      ? selectedBranchId ||
        undefined
      : managedBranch?.id;

  const scopeKey =
    isSuperAdmin
      ? selectedBranchId ||
        'all-branches'
      : managedBranch?.id ||
        'unassigned-manager';

  const productsQuery =
    useQuery({
      queryKey: [
        'admin',
        'products',
        'management',
        scopeKey,
      ],

      queryFn: () =>
        getManagementProducts(
          isSuperAdmin &&
            selectedBranchId
            ? {
                branchId:
                  selectedBranchId,
              }
            : {},
        ),

      enabled:
        isSuperAdmin ||
        Boolean(
          managedBranch?.id,
        ),
    });

  const categoriesQuery =
    useQuery({
      queryKey: [
        'admin',
        'product-categories',
        'management',
        scopeKey,
      ],

      queryFn: () =>
        getManagementCategories(
          isSuperAdmin &&
            selectedBranchId
            ? {
                branchId:
                  selectedBranchId,
              }
            : {},
        ),

      enabled:
        isSuperAdmin ||
        Boolean(
          managedBranch?.id,
        ),
    });

  const products =
    productsQuery.data ??
    [];

  const categories =
    categoriesQuery.data ??
    [];

  const formBranchId =
    selectedProduct?.branchId ??
    effectiveBranchId;

  const formCategories =
    categories.filter(
      (category) =>
        !formBranchId ||
        category.branchId ===
          formBranchId,
    );

  const canCreate =
    isSuperAdmin
      ? Boolean(
          selectedScopeBranch
            ?.isActive,
        )
      : Boolean(
          managedBranch?.id &&
            managedBranch.isActive,
        );

  const createBlockedMessage =
    isSuperAdmin
      ? selectedScopeBranch &&
        !selectedScopeBranch.isActive
        ? 'The selected branch is inactive. Choose an active branch before creating catalogue records.'
        : 'Select an active branch before creating a product or category.'
      : managedBranch
        ? 'Your managed branch is inactive. Catalogue creation is unavailable until the branch is reactivated.'
        : 'Your Branch Manager account is not assigned to a branch.';

  const productToggleMutation =
    useMutation({
      mutationFn: async (
        product: Product,
      ) =>
        updateProduct(product.id, {
          isActive: !product.isActive,
        }),

      onSuccess: async (
        updatedProduct,
      ) => {
        await queryClient.invalidateQueries({
          queryKey: [
            'admin',
            'products',
          ],
        });

        setNotice({
          type: 'success',
          message: updatedProduct.isActive
            ? 'Product activated successfully.'
            : 'Product deactivated successfully.',
        });
      },

      onError: (error) => {
        setNotice({
          type: 'error',
          message:
            getErrorMessage(error),
        });
      },
    });

  const categoryToggleMutation =
    useMutation({
      mutationFn: async (
        category: ProductCategory,
      ) =>
        updateCategory(category.id, {
          isActive: !category.isActive,
        }),

      onSuccess: async (
        updatedCategory,
      ) => {
        await queryClient.invalidateQueries({
          queryKey: [
            'admin',
            'product-categories',
          ],
        });

        setNotice({
          type: 'success',
          message: updatedCategory.isActive
            ? 'Category activated successfully.'
            : 'Category deactivated successfully.',
        });
      },

      onError: (error) => {
        setNotice({
          type: 'error',
          message:
            getErrorMessage(error),
        });
      },
    });

  const filteredProducts =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      if (!term) {
        return products;
      }

      return products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(term) ||
          product.sku
            .toLowerCase()
            .includes(term) ||
          product.category.name
            .toLowerCase()
            .includes(term) ||
          productTypeLabels[
            product.type
          ]
            .toLowerCase()
            .includes(term),
      );
    }, [products, search]);

  const activeProducts =
    products.filter(
      (product) => product.isActive,
    ).length;

  const activeCategories =
    categories.filter(
      (category) => category.isActive,
    ).length;

  const isLoading =
    productsQuery.isLoading ||
    categoriesQuery.isLoading;

  const isError =
    productsQuery.isError ||
    categoriesQuery.isError;

  const closeProductEditor = () => {
    setProductEditorOpen(false);
    setSelectedProduct(null);
  };

  const closeCategoryEditor = () => {
    setCategoryEditorOpen(false);
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-full bg-[#f7faf8]">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <NoticeBanner
          notice={notice}
          onClose={() =>
            setNotice(null)
          }
        />

        <div className="overflow-hidden rounded-[28px] border border-emerald-100/80 bg-gradient-to-br from-[#073f35] via-[#0b5748] to-[#0c6a55] p-5 text-white shadow-[0_22px_65px_rgba(6,78,65,0.16)] sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                <PackageSearch className="size-5 text-emerald-200" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
                Catalogue operations
              </p>

              <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                Products
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/70">
                Manage branch-owned products,
                pricing, availability and
                categories with strict
                branch isolation.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  if (!canCreate) {
                    setNotice({
                      type: 'error',
                      message:
                        createBlockedMessage,
                    });

                    return;
                  }

                  setSelectedCategory(null);
                  setCategoryEditorOpen(true);
                }}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <Tag className="size-4" />
                New category
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!canCreate) {
                    setNotice({
                      type: 'error',
                      message:
                        createBlockedMessage,
                    });

                    return;
                  }

                  setSelectedProduct(null);
                  setProductEditorOpen(true);
                }}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
              >
                <CirclePlus className="size-4" />
                Add product
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[22px] border border-slate-200/70 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                Catalogue branch
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {isSuperAdmin
                  ? selectedScopeBranch
                    ? selectedScopeBranch.name
                    : 'All branches'
                  : managedBranch?.name ??
                    'No branch assigned'}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {isSuperAdmin
                  ? selectedScopeBranch
                    ? `Branch code ${selectedScopeBranch.code}. Creation is locked to this branch.`
                    : 'Viewing the company-wide catalogue. Choose one branch before creating records.'
                  : managedBranch
                    ? `Branch code ${managedBranch.code}. Your catalogue is isolated to this branch.`
                    : 'A Super Admin must assign this account to a branch before catalogue operations can continue.'}
              </p>
            </div>

            {isSuperAdmin ? (
              <label className="w-full lg:max-w-sm">
                <span className="sr-only">
                  Catalogue branch
                </span>

                <select
                  value={selectedBranchId}
                  onChange={(event) => {
                    setSelectedBranchId(
                      event.target.value,
                    );

                    setSelectedProduct(
                      null,
                    );

                    setSelectedCategory(
                      null,
                    );

                    setProductEditorOpen(
                      false,
                    );

                    setCategoryEditorOpen(
                      false,
                    );
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="">
                    All branches
                  </option>

                  {branches.map(
                    (branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name} ?{' '}
                        {branch.code}
                        {branch.isActive
                          ? ''
                          : ' (Inactive)'}
                      </option>
                    ),
                  )}
                </select>
              </label>
            ) : (
              <div
                className={[
                  'rounded-xl border px-4 py-3 text-xs font-semibold',
                  managedBranch?.isActive
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700',
                ].join(' ')}
              >
                {managedBranch?.isActive
                  ? 'Managed branch locked'
                  : 'Branch action required'}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Total products',
              value: products.length,
              icon: Boxes,
            },
            {
              label: 'Active products',
              value: activeProducts,
              icon: PackageCheck,
            },
            {
              label: 'Categories',
              value: categories.length,
              icon: Layers3,
            },
            {
              label:
                'Active categories',
              value: activeCategories,
              icon: Tag,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-[22px] border border-slate-200/70 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">
                    {item.label}
                  </p>

                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon className="size-4" />
                  </div>
                </div>

                <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  {isLoading
                    ? '—'
                    : item.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Product catalogue
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Create, edit and control
                product availability.
              </p>
            </div>

            <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 sm:max-w-sm">
              <Search className="size-4 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search name, SKU, category..."
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          <div className="hidden grid-cols-[minmax(220px,1.5fr)_minmax(130px,.8fr)_minmax(130px,.8fr)_minmax(140px,.8fr)_150px] border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400 xl:grid">
            <span>Product</span>
            <span>Category</span>
            <span>Type</span>
            <span>Price</span>
            <span className="text-right">
              Actions
            </span>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Loading catalogue…
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <AlertCircle className="size-6 text-rose-500" />

              <p className="mt-3 text-sm font-semibold text-slate-800">
                Catalogue could not be
                loaded.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Check the API connection
                and try again.
              </p>
            </div>
          ) : filteredProducts.length ===
            0 ? (
            <div className="p-10 text-center">
              <PackageSearch className="mx-auto size-7 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No products found.
              </p>
            </div>
          ) : (
            filteredProducts.map(
              (product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  togglePending={
                    productToggleMutation.isPending
                  }
                  onEdit={() => {
                    setSelectedProduct(
                      product,
                    );
                    setProductEditorOpen(
                      true,
                    );
                  }}
                  onToggle={() =>
                    productToggleMutation.mutate(
                      product,
                    )
                  }
                />
              ),
            )
          )}
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.045)]">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Categories
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Organise the catalogue into
                manageable groups.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                  if (!canCreate) {
                    setNotice({
                      type: 'error',
                      message:
                        createBlockedMessage,
                    });

                    return;
                  }

                  setSelectedCategory(null);
                  setCategoryEditorOpen(true);
                }}
              className="hidden h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 sm:flex"
            >
              <CirclePlus className="size-3.5" />
              Add category
            </button>
          </div>

          {categories.length === 0 &&
          !categoriesQuery.isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No categories found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {categories.map(
                (category) => (
                  <div
                    key={category.id}
                    className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {category.name}
                        </p>

                        <span
                          className={[
                            'rounded-full px-2 py-0.5 text-[10px] font-bold',
                            category.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500',
                          ].join(' ')}
                        >
                          {category.isActive
                            ? 'ACTIVE'
                            : 'INACTIVE'}
                        </span>
                      </div>

                      <p className="mt-1 max-w-2xl truncate text-xs text-slate-400">
                        {category.description ||
                          'No description'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(
                            category,
                          );
                          setCategoryEditorOpen(
                            true,
                          );
                        }}
                        className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Edit3 className="size-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={
                          categoryToggleMutation.isPending
                        }
                        onClick={() =>
                          categoryToggleMutation.mutate(
                            category,
                          )
                        }
                        className={[
                          'flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition disabled:opacity-50',
                          category.isActive
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
                        ].join(' ')}
                      >
                        {category.isActive
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {productEditorOpen ? (
        <Modal
          title={
            selectedProduct
              ? 'Edit product'
              : 'Create product'
          }
          description={
            selectedProduct
              ? 'Update product details, pricing, category or availability.'
              : 'Add a new item to the Ogun’s Sure Gas master catalogue.'
          }
          onClose={closeProductEditor}
        >
          <ProductForm
            key={
              selectedProduct?.id ??
              'new-product'
            }
            product={selectedProduct}
            categories={formCategories}
            createBranchId={
              isSuperAdmin
                ? selectedBranchId ||
                  undefined
                : undefined
            }
            onCancel={closeProductEditor}
            onSuccess={(message) => {
              closeProductEditor();

              setNotice({
                type: 'success',
                message,
              });
            }}
          />
        </Modal>
      ) : null}

      {categoryEditorOpen ? (
        <Modal
          title={
            selectedCategory
              ? 'Edit category'
              : 'Create category'
          }
          description={
            selectedCategory
              ? 'Update category information and availability.'
              : 'Create a new catalogue category.'
          }
          onClose={closeCategoryEditor}
        >
          <CategoryForm
            key={
              selectedCategory?.id ??
              'new-category'
            }
            category={selectedCategory}
            createBranchId={
              isSuperAdmin
                ? selectedBranchId ||
                  undefined
                : undefined
            }
            onCancel={closeCategoryEditor}
            onSuccess={(message) => {
              closeCategoryEditor();

              setNotice({
                type: 'success',
                message,
              });
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
