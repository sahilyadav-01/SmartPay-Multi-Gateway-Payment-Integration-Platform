import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states for creating / editing
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await api.products.list();
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setDescription('');
    setImage('');
    setCategory('General');
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingId(product._id);
    setName(product.name);
    setPrice(product.price.toString());
    setDescription(product.description);
    setImage(product.image || '');
    setCategory(product.category || 'General');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.products.delete(id);
      if (res.success) {
        alert('Product deleted successfully');
        fetchProducts();
      }
    } catch (err) {
      alert(err.message || 'Delete operation failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      price: parseFloat(price),
      description,
      image,
      category
    };

    try {
      if (editingId) {
        await api.products.update(editingId, payload);
        alert('Product updated successfully');
      } else {
        await api.products.create(payload);
        alert('Product created successfully');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Failed to save product');
    }
  };

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0 }}>Product Inventory Management</h3>
        <button onClick={openAddModal} className="btn">
          + Add Product
        </button>
      </div>

      {loading ? (
        <div>Loading inventory...</div>
      ) : error ? (
        <div style={{ color: 'var(--error-color)' }}>{error}</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Name</th>
              <th style={{ padding: 12 }}>Category</th>
              <th style={{ padding: 12 }}>Price</th>
              <th style={{ padding: 12 }}>Description</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{product.name}</td>
                  <td style={{ padding: 12 }}>{product.category || 'General'}</td>
                  <td style={{ padding: 12 }}>${product.price.toFixed(2)}</td>
                  <td style={{ padding: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.description}
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <button 
                      onClick={() => openEditModal(product)} 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', marginRight: 8, fontSize: 12 }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(product._id)} 
                      className="btn btn-danger" 
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No products available in database. Add a product to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: 500, backgroundColor: 'var(--bg-surface-solid)' }}>
            <h3 style={{ marginBottom: 20 }}>{editingId ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Price ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  className="form-input" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input 
                  type="text" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="form-input" 
                  rows="3" 
                  required 
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input 
                  type="text" 
                  value={image} 
                  onChange={(e) => setImage(e.target.value)} 
                  className="form-input" 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn">
                  {editingId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
