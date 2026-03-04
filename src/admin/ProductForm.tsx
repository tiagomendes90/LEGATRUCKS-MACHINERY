import AddVehicleForm from '@/components/AddVehicleForm';

interface ProductFormProps {
  editingProduct?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ProductForm = ({ editingProduct, onSuccess, onCancel }: ProductFormProps) => {
  return (
    <AddVehicleForm
      editingVehicle={editingProduct}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
};

export default ProductForm;
