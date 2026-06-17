import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { MapPin, ArrowLeft } from 'lucide-react';
import api from '../../lib/axios';
import Input, { Textarea, Select } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ImageUpload from '../../components/ui/ImageUpload';
import toast from 'react-hot-toast';

export default function CreateLostItemPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { dateLost: new Date().toISOString().split('T')[0] },
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

      const res = await api.post('/lost-items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Lost item report created!');
      navigate(`/dashboard/lost/${res.data.data.item.uuid}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create report.');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = categories.map(c => ({
    value: c.id.toString(),
    label: `${c.icon} ${c.name}`,
  }));

  const colorOptions = [
    { value: 'Black', label: 'Black' }, { value: 'White', label: 'White' },
    { value: 'Red', label: 'Red' }, { value: 'Blue', label: 'Blue' },
    { value: 'Green', label: 'Green' }, { value: 'Yellow', label: 'Yellow' },
    { value: 'Orange', label: 'Orange' }, { value: 'Purple', label: 'Purple' },
    { value: 'Pink', label: 'Pink' }, { value: 'Brown', label: 'Brown' },
    { value: 'Gray', label: 'Gray' }, { value: 'Silver', label: 'Silver' },
    { value: 'Gold', label: 'Gold' }, { value: 'Other', label: 'Other' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin size={22} className="text-neon-cyan" /> Report Lost Item
          </h1>
          <p className="text-white/40 text-sm">Provide details to help find your item faster</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="rounded-xl p-6 space-y-5"
          style={{ background: '#0D1117', border: '1px solid rgba(0,240,255,0.1)' }}>
          <h3 className="text-sm font-semibold text-neon-cyan/70 tracking-widest uppercase">Item Details</h3>

          <Input
            label="Item Title *"
            placeholder="e.g. Black iPhone 15 Pro Max"
            error={errors.title?.message}
            {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'Min 3 characters' } })}
          />

          <Textarea
            label="Description *"
            placeholder="Describe the item in detail — unique features, condition, any distinguishing marks..."
            rows={4}
            error={errors.description?.message}
            {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Min 10 characters' } })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category"
              placeholder="Select category"
              options={categoryOptions}
              {...register('categoryId')}
            />
            <Input
              label="Brand"
              placeholder="e.g. Apple, Samsung"
              {...register('brand')}
            />
          </div>

          <Select
            label="Color"
            placeholder="Select primary color"
            options={colorOptions}
            {...register('color')}
          />
        </div>

        <div className="rounded-xl p-6 space-y-5"
          style={{ background: '#0D1117', border: '1px solid rgba(255,0,127,0.1)' }}>
          <h3 className="text-sm font-semibold text-neon-pink/70 tracking-widest uppercase">Location & Time</h3>

          <Input
            label="Last Known Location *"
            placeholder="e.g. Central Park, New York, NY"
            error={errors.location?.message}
            {...register('location', { required: 'Location is required' })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date Lost *"
              type="date"
              error={errors.dateLost?.message}
              {...register('dateLost', { required: 'Date is required' })}
            />
            <Input
              label="Approximate Time"
              type="time"
              {...register('timeLost')}
            />
          </div>
        </div>

        <div className="rounded-xl p-6 space-y-5"
          style={{ background: '#0D1117', border: '1px solid rgba(57,255,20,0.1)' }}>
          <h3 className="text-sm font-semibold text-neon-green/70 tracking-widest uppercase">Reward & Contact</h3>

          <Input
            label="Reward Amount (optional)"
            type="number"
            placeholder="0"
            min="0"
            step="0.01"
            hint="Offering a reward may increase recovery chances"
            {...register('reward')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contact Email"
              type="email"
              placeholder="your@email.com"
              {...register('contactEmail')}
            />
            <Input
              label="Contact Phone"
              placeholder="+1 234 567 8900"
              {...register('contactPhone')}
            />
          </div>
        </div>

        <div className="rounded-xl p-6"
          style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}>
          <ImageUpload
            label="Item Photos (up to 5)"
            files={images}
            onChange={setImages}
            maxFiles={5}
          />
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
            Cancel
          </button>
          <Button type="submit" loading={loading} className="flex-1">
            Submit Report
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
