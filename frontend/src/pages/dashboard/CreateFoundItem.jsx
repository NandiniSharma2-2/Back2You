import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Package, ArrowLeft } from 'lucide-react';
import api from '../../lib/axios';
import Input, { Textarea, Select } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ImageUpload from '../../components/ui/ImageUpload';
import toast from 'react-hot-toast';

export default function CreateFoundItemPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { dateFound: new Date().toISOString().split('T')[0] },
  });

  useEffect(() => {
    api.get('/admin/categories/public')
      .then(r => setCategories(r.data.data.categories || []))
      .catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== '') formData.append(key, value);
      });
      images.forEach(img => formData.append('images', img));

      const res = await api.post('/found-items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Found item report created!');
      navigate(`/dashboard/found/${res.data.data.item.uuid}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create report.');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = categories.map(c => ({ value: c.id.toString(), label: `${c.icon} ${c.name}` }));
  const colorOptions = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Gray', 'Silver', 'Gold', 'Other']
    .map(c => ({ value: c, label: c }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package size={22} className="text-neon-pink" /> Report Found Item
          </h1>
          <p className="text-white/40 text-sm">Help reunite someone with their lost belonging</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="rounded-xl p-6 space-y-5"
          style={{ background: '#0D1117', border: '1px solid rgba(255,0,127,0.1)' }}>
          <h3 className="text-sm font-semibold text-neon-pink/70 tracking-widest uppercase">Item Details</h3>

          <Input
            label="What Did You Find? *"
            placeholder="e.g. Brown leather wallet with cash"
            error={errors.title?.message}
            {...register('title', { required: 'Title required', minLength: { value: 3, message: 'Min 3 characters' } })}
          />

          <Textarea
            label="Description *"
            placeholder="Describe the item clearly — condition, contents, distinguishing features..."
            rows={4}
            error={errors.description?.message}
            {...register('description', { required: 'Description required', minLength: { value: 10, message: 'Min 10 characters' } })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              placeholder="Select category"
              options={categoryOptions}
              {...register('categoryId')}
            />
            <Input label="Brand" placeholder="e.g. Louis Vuitton" {...register('brand')} />
          </div>

          <Select
            label="Color"
            placeholder="Select primary color"
            options={colorOptions}
            {...register('color')}
          />
        </div>

        <div className="rounded-xl p-6 space-y-5"
          style={{ background: '#0D1117', border: '1px solid rgba(0,240,255,0.1)' }}>
          <h3 className="text-sm font-semibold text-neon-cyan/70 tracking-widest uppercase">Where & When Found</h3>

          <Input
            label="Location Found *"
            placeholder="e.g. Times Square, New York, NY"
            error={errors.location?.message}
            {...register('location', { required: 'Location required' })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date Found *"
              type="date"
              error={errors.dateFound?.message}
              {...register('dateFound', { required: 'Date required' })}
            />
            <Input label="Time Found" type="time" {...register('timeFound')} />
          </div>

          <Input
            label="Storage Location"
            placeholder="Where is the item now? (e.g. Police station, Home)"
            hint="This helps the owner know where to pick it up"
            {...register('storageLocation')}
          />
        </div>

        <div className="rounded-xl p-6 space-y-4"
          style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-semibold text-white/40 tracking-widest uppercase">Contact Info</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Email" type="email" {...register('contactEmail')} />
            <Input label="Contact Phone" {...register('contactPhone')} />
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <ImageUpload label="Photos of Found Item (up to 5)" files={images} onChange={setImages} maxFiles={5} />
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
          <Button type="submit" loading={loading} className="flex-1">Submit Report</Button>
        </div>
      </motion.form>
    </div>
  );
}
