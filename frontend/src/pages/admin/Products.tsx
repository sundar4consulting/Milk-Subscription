import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { adminProductService } from '@/services/adminService';
import {
  Card,
  CardHeader,
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  StatusBadge,
  PageLoader,
  ErrorState,
  EmptyState,
} from '@/components/ui';
import { formatCurrency } from '@/utils';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

interface ProductFormData {
  name: string;
  description: string;
  unit: string;
  pricePerUnit: number;
  category: string;
  minQuantity: number;
  maxQuantity: number;
  isAvailable: boolean;
  imageUrl?: string;
}

export const AdminProducts: React.FC = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: adminProductService.getAll,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>();

  const {
    register: editRegister,
    handleSubmit: editHandleSubmit,
    reset: editReset,
    formState: { errors: editErrors },
  } = useForm<ProductFormData>();

  const createMutation = useMutation({
    mutationFn: adminProductService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      setCreateOpen(false);
      reset();
      toast.success('Product created successfully');
    },
    onError: () => {
      toast.error('Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
      adminProductService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      setEditProduct(null);
      editReset();
      toast.success('Product updated successfully');
    },
    onError: () => {
      toast.error('Failed to update product');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminProductService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      setDeleteProduct(null);
      toast.success('Product deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete product');
    },
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const onCreateSubmit = (data: ProductFormData) => {
    createMutation.mutate({
      ...data,
      pricePerUnit: parseFloat(data.pricePerUnit.toString()),
      minQuantity: parseInt(data.minQuantity.toString()),
      maxQuantity: parseInt(data.maxQuantity.toString()),
    });
  };

  const onEditSubmit = (data: ProductFormData) => {
    if (!editProduct) return;
    updateMutation.mutate({
      id: editProduct.id,
      data: {
        ...data,
        pricePerUnit: parseFloat(data.pricePerUnit.toString()),
        minQuantity: parseInt(data.minQuantity.toString()),
        maxQuantity: parseInt(data.maxQuantity.toString()),
      },
    });
  };

  const handleEditClick = (product: Product) => {
    setEditProduct(product);
    editReset({
      name: product.name,
      description: product.description || '',
      unit: product.unit,
      pricePerUnit: product.pricePerUnit,
      category: product.category,
      minQuantity: product.minQuantity,
      maxQuantity: product.maxQuantity,
      isAvailable: product.isAvailable,
      imageUrl: product.imageUrl || '',
    });
  };

  const categories = [
    { value: 'MILK', label: 'Milk' },
    { value: 'CURD', label: 'Curd' },
    { value: 'BUTTERMILK', label: 'Buttermilk' },
    { value: 'PANEER', label: 'Paneer' },
    { value: 'BUTTER', label: 'Butter' },
    { value: 'GHEE', label: 'Ghee' },
    { value: 'OTHER', label: 'Other' },
  ];

  const units = [
    { value: 'ml', label: 'Milliliters (ml)' },
    { value: 'litre', label: 'Liters' },
    { value: 'gram', label: 'Grams' },
    { value: 'kg', label: 'Kilograms' },
    { value: 'piece', label: 'Piece' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          leftIcon={<PlusIcon className="h-5 w-5" />}
        >
          Add Product
        </Button>
      </div>

      {!products || products.length === 0 ? (
        <EmptyState
          title="No products"
          description="Start by adding your first product"
          action={{
            label: 'Add Product',
            onClick: () => setCreateOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col">
              {product.imageUrl && (
                <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <span className="text-sm text-gray-500">{product.category}</span>
                  </div>
                  <StatusBadge
                    status={product.isAvailable ? 'ACTIVE' : 'INACTIVE'}
                  />
                </div>
                <p className="text-gray-600 text-sm mb-3 flex-1 line-clamp-2">
                  {product.description || 'No description'}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price</span>
                    <span className="font-medium">
                      {formatCurrency(product.pricePerUnit)} / {product.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantity Range</span>
                    <span>
                      {product.minQuantity} - {product.maxQuantity}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditClick(product)}
                    leftIcon={<PencilIcon className="h-4 w-4" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onClick={() => setDeleteProduct(product)}
                    leftIcon={<TrashIcon className="h-4 w-4" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Product Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          reset();
        }}
        title="Add New Product"
        size="lg"
      >
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <Input
            label="Product Name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
          <Textarea
            label="Description"
            rows={3}
            {...register('description')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={categories}
              {...register('category', { required: 'Category is required' })}
              error={editErrors.category?.message}
            />
            <Select
              label="Unit"
              options={units}
              {...register('unit', { required: 'Unit is required' })}
              error={errors.unit?.message}
            />
          </div>
          <Input
            label="Price per Unit"
            type="number"
            step="0.01"
            {...register('pricePerUnit', {
              required: 'Price is required',
              min: { value: 0, message: 'Price must be positive' },
            })}
            error={errors.pricePerUnit?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Quantity"
              type="number"
              {...register('minQuantity', {
                required: 'Min quantity is required',
                min: { value: 1, message: 'Min must be at least 1' },
              })}
              error={errors.minQuantity?.message}
            />
            <Input
              label="Max Quantity"
              type="number"
              {...register('maxQuantity', {
                required: 'Max quantity is required',
              })}
              error={errors.maxQuantity?.message}
            />
          </div>
          <Input
            label="Image URL"
            type="url"
            {...register('imageUrl')}
            placeholder="https://example.com/image.jpg"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAvailable"
              {...register('isAvailable')}
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isAvailable" className="text-sm text-gray-700">
              Available for purchase
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editProduct}
        onClose={() => {
          setEditProduct(null);
          editReset();
        }}
        title="Edit Product"
        size="lg"
      >
        {editProduct && (
          <form onSubmit={editHandleSubmit(onEditSubmit)} className="space-y-4">
            <Input
              label="Product Name"
              {...editRegister('name', { required: 'Name is required' })}
              error={editErrors.name?.message}
            />
            <Textarea
              label="Description"
              rows={3}
              {...editRegister('description')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                options={categories}
                {...editRegister('category', { required: 'Category is required' })}
                error={editErrors.category?.message}
              />
              <Select
                label="Unit"
                options={units}
                {...editRegister('unit', { required: 'Unit is required' })}
                error={editErrors.unit?.message}
              />
            </div>
            <Input
              label="Price per Unit"
              type="number"
              step="0.01"
              {...editRegister('pricePerUnit', {
                required: 'Price is required',
                min: { value: 0, message: 'Price must be positive' },
              })}
              error={editErrors.pricePerUnit?.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Min Quantity"
                type="number"
                {...editRegister('minQuantity', {
                  required: 'Min quantity is required',
                  min: { value: 1, message: 'Min must be at least 1' },
                })}
                error={editErrors.minQuantity?.message}
              />
              <Input
                label="Max Quantity"
                type="number"
                {...editRegister('maxQuantity', {
                  required: 'Max quantity is required',
                })}
                error={editErrors.maxQuantity?.message}
              />
            </div>
            <Input
              label="Image URL"
              type="url"
              {...editRegister('imageUrl')}
              placeholder="https://example.com/image.jpg"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsAvailable"
                {...editRegister('isAvailable')}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="editIsAvailable" className="text-sm text-gray-700">
                Available for purchase
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditProduct(null);
                  editReset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending}>
                Update Product
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        title="Delete Product"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "{deleteProduct?.name}"? This action
          cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteProduct(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMutation.mutate(deleteProduct!.id)}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};
