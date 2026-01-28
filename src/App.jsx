import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Search, Loader2 } from 'lucide-react';
import './App.css'; // เรียกใช้ไฟล์ CSS ที่เราสร้าง

// *** ใส่ URL ของคุณที่นี่เหมือนเดิม ***
const API_URL = "https://script.google.com/macros/s/AKfycbyWRH_BkF2A02YcOclsBKa0jai0cZMViTw2dTiYv92FOXowHaWSffLvsXWHc6nnYvMKyg/exec"; 

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [borrowerName, setBorrowerName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setItems(response.data);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire('Error', 'ไม่สามารถดึงข้อมูลได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'ready' ? item.status === 'พร้อมให้ยืม' :
      item.status === 'ถูกยืม';
    return matchSearch && matchStatus;
  });

  const handleBorrowClick = (item) => {
    setSelectedItem(item);
    setBorrowerName('');
    setIsModalOpen(true);
  };

  const confirmBorrow = async () => {
    if (!borrowerName.trim()) return Swal.fire('แจ้งเตือน', 'กรุณากรอกชื่อผู้ยืม', 'warning');
    
    setIsModalOpen(false);
    Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      await axios.post(API_URL, JSON.stringify({
        action: 'borrow',
        equipmentId: selectedItem.id,
        borrowerName: borrowerName
      }), { headers: { "Content-Type": "text/plain" } });
      
      await fetchData();
      Swal.fire('สำเร็จ', 'ยืมอุปกรณ์เรียบร้อย', 'success');
    } catch (error) {
      Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

 const handleReturnClick = (item) => {
    Swal.fire({
      title: 'ยืนยันการคืน?',
      text: `ต้องการคืน "${item.name}" ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ใช่, คืนของ',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        try {
          // --- แก้ไขจุดที่ 1: เติมโค้ดบรรทัดนี้ให้สมบูรณ์ ---
          await axios.post(API_URL, JSON.stringify({ 
            action: 'return', 
            equipmentId: item.id 
          }), { headers: { "Content-Type": "text/plain" } });
          
          await fetchData();
          Swal.fire('สำเร็จ', 'คืนอุปกรณ์เรียบร้อย', 'success');
        } catch (error) {
          Swal.fire('ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
        }
      }
    }); // --- แก้ไขจุดที่ 2: เพิ่ม }); เพื่อปิด .then
  }; // --- แก้ไขจุดที่ 2: เพิ่ม }; เพื่อปิด function

  return (
    <div className="app-container">
      
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>📦 ระบบยืม-คืนอุปกรณ์</h1>
          <span style={{opacity: 0.8, fontSize: '0.8rem'}}>React + Google Sheets</span>
        </div>
      </header>

      <main className="container">
        
        {/* Controls */}
        <div className="controls">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="ค้นหาอุปกรณ์..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-buttons">
            {['all', 'ready', 'borrowed'].map(status => (
              <button 
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`btn-filter ${filterStatus === status ? 'active' : ''}`}
              >
                {status === 'all' ? 'ทั้งหมด' : status === 'ready' ? 'พร้อมให้ยืม' : 'ถูกยืม'}
              </button>
            ))}
          </div>
        </div>

        {/* Loading & Grid */}
        {loading ? (
          <div style={{textAlign: 'center', marginTop: '50px'}}>
            <Loader2 className="spin" size={40} color="#dc2743" />
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="card-grid">
            {filteredItems.map(item => {
              const isBorrowed = item.status === 'ถูกยืม';
              return (
                <div key={item.id} className="card">
                  <div className="card-image-wrapper">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="card-img"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'}
                    />
                    <span className={`status-badge ${isBorrowed ? 'status-borrowed' : 'status-ready'}`}>
                      {item.status}
                    </span>
                  </div>
                  
                  <div className="card-body">
                    <div>
                      <h3 className="card-title">{item.name}</h3>
                      <p className="card-meta">{item.type} • {item.id}</p>
                    </div>

                    <div style={{marginTop: '15px'}}>
                      {isBorrowed ? (
                        <div>
                          <div className="borrow-info">
                            <div><b>ผู้ยืม:</b> {item.borrower}</div>
                            <div><b>วันที่:</b> {item.borrowDate}</div>
                          </div>
                          <button onClick={() => handleReturnClick(item)} className="btn btn-secondary">
                            แจ้งคืนอุปกรณ์
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleBorrowClick(item)} className="btn btn-primary">
                          ยืมอุปกรณ์
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>ยืมอุปกรณ์: {selectedItem?.name}</h3>
            
            <label style={{display:'block', marginBottom:'5px'}}>ชื่อผู้ยืม</label>
            <input 
              type="text" 
              autoFocus
              className="form-input"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              placeholder="ระบุชื่อของคุณ..."
            />
            
            <div className="modal-actions">
              <button onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                ยกเลิก
              </button>
              <button onClick={confirmBorrow} className="btn btn-primary">
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;