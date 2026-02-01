// ==============================================
// إعدادات API
// ==============================================

const API_URL = 'http://localhost:5000';

let vehiclesData = [];
let inspectionsData = [];
let analyticsData = {};
let selectedVehicleId = null;

// ==============================================
// وظائف API
// ==============================================

// جلب السيارات من الخادم
async function loadVehiclesData() {
  try {
    console.log('🔄 جاري تحميل بيانات السيارات من الخادم...');
    
    const response = await fetch('/get_vehicles');
    if (!response.ok) {
      throw new Error('فشل الاتصال بالخادم');
    }
    
    vehiclesData = await response.json();
    console.log('✅ تم تحميل بيانات السيارات:', vehiclesData.length, 'سيارة');
    return true;
    
  } catch (error) {
    console.error('❌ خطأ في تحميل بيانات السيارات:', error);
    showErrorMessage('فشل الاتصال بالخادم. تأكد من تشغيل: python app.py');
    return false;
  }
}

// جلب الفحوصات من الخادم
async function loadInspectionsData() {
  try {
    console.log('🔄 جاري تحميل بيانات الفحوصات من الخادم...');
    
    const response = await fetch(`/get_inspections`);
    if (!response.ok) {
      throw new Error('فشل الاتصال بالخادم');
    }
    
    inspectionsData = await response.json();
    console.log('✅ تم تحميل بيانات الفحوصات:', inspectionsData.length, 'فحص');
    return true;
    
  } catch (error) {
    console.error('❌ خطأ في تحميل بيانات الفحوصات:', error);
    return false;
  }
}

// جلب الإحصائيات من الخادم
async function loadAnalyticsData() {
  try {
    const response = await fetch(`/get_analytics`);
    if (response.ok) {
      analyticsData = await response.json();
      console.log('✅ تم تحميل الإحصائيات');
    }
  } catch (error) {
    console.error('⚠️ لم يتم تحميل الإحصائيات:', error);
  }
}

// إضافة سيارة جديدة إلى الخادم
async function addVehicleToServer(vehicleData) {
  try {
    const response = await fetch(`/add_vehicle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData)
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('✅ تمت إضافة السيارة إلى قاعدة البيانات');
      return true;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('❌ خطأ في إضافة السيارة:', error);
    return false;
  }
}

// حذف سيارة من الخادم
async function deleteVehicleFromServer(vehicleId) {
  try {
    const response = await fetch(`/delete_vehicle/${vehicleId}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('✅ تم حذف السيارة من قاعدة البيانات');
      return true;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('❌ خطأ في حذف السيارة:', error);
    return false;
  }
}

// إضافة فحص جديد إلى الخادم
async function addInspectionToServer(inspectionData) {
  try {
    const response = await fetch(`${API_URL}/add_inspection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inspectionData)
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('✅ تم حفظ الفحص في قاعدة البيانات');
      return true;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('❌ خطأ في حفظ الفحص:', error);
    return false;
  }
}

// ==============================================
// تهيئة الصفحة
// ==============================================

document.addEventListener("DOMContentLoaded", async function() {
  // عرض رسالة تحميل
  showLoadingMessage();
  
  // تحميل البيانات من الخادم
  const vehiclesLoaded = await loadVehiclesData();
  const inspectionsLoaded = await loadInspectionsData();
  await loadAnalyticsData();
  
  // إخفاء رسالة التحميل
  hideLoadingMessage();
  
  // التحقق من نجاح التحميل
  if (!vehiclesLoaded) {
    return;
  }
  
  // تهيئة العناصر
  populateVehicleTable();
  initializeTabs();
  initializeFormValidation();
  updateDashboard();
  populateRemoveDropdown();
});

function showLoadingMessage() {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loadingMessage';
  loadingDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #2196F3;
    color: white;
    padding: 15px;
    text-align: center;
    z-index: 9999;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;
  loadingDiv.innerHTML = '⏳ جاري تحميل البيانات من الخادم... <small style="display:block; margin-top:5px; opacity:0.9;">Loading from server</small>';
  document.body.appendChild(loadingDiv);
}

function hideLoadingMessage() {
  const loadingDiv = document.getElementById('loadingMessage');
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.id = 'errorMessage';
  errorDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #f44336;
    color: white;
    padding: 15px;
    text-align: center;
    z-index: 9999;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;
  errorDiv.textContent = '❌ ' + message;
  document.body.appendChild(errorDiv);
}

function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #4CAF50;
    color: white;
    padding: 15px;
    text-align: center;
    z-index: 9999;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;
  successDiv.textContent = '✅ ' + message;
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

// ==============================================
// عرض جدول السيارات
// ==============================================

function populateVehicleTable(filterData = null) {
  const tbody = document.getElementById('vehicleTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const dataToShow = filterData || vehiclesData;
  
  // التحقق من وجود بيانات
  if (!dataToShow || dataToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">لا توجد بيانات لعرضها</td></tr>';
    return;
  }
  
  dataToShow.forEach(vehicle => {
    // البحث عن آخر فحص للسيارة
    const lastInspection = inspectionsData
      .filter(insp => insp.vehicleId === vehicle.id || insp.doorNo === vehicle.doorNo)
      .sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate))[0];
    
    const lastInspectionDate = lastInspection ? lastInspection.inspectionDate : 'Never';
    const status = lastInspection ? lastInspection.overallStatus : 'Not Inspected';
    
    const statusColor = status === 'Passed' ? 'var(--success)' : 
                       status === 'Action Required' ? 'var(--warning)' : 
                       'var(--text-light)';
    
    // تنسيق Vehicle Size
    let vehicleSizeDisplay = 'N/A';
    if (vehicle.vehicleSize) {
      if (vehicle.vehicleSize === '4x2') {
        vehicleSizeDisplay = '4x2';
      } else if (vehicle.vehicleSize === '4x4-offroad') {
        vehicleSizeDisplay = '4x4 Off-Road';
      } else if (vehicle.vehicleSize === '4x4-nonoffroad') {
        vehicleSizeDisplay = '4x4 Non Off-Road';
      } else {
        vehicleSizeDisplay = vehicle.vehicleSize;
      }
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td style="font-weight: 600;">${vehicle.doorNo || 'N/A'}</td>
      <td>${vehicle.plateNo || 'N/A'}</td>
      <td>${vehicle.division || 'N/A'}</td>
      <td>${vehicle.vehicleType || 'N/A'}</td>
      <td>${vehicleSizeDisplay}</td>
      <td>${lastInspectionDate}</td>
      <td><span style="color: ${statusColor}; font-weight: 600;">${status}</span></td>
      <td>
        <button type="button" class="btn" style="padding: 8px 16px; font-size: 13px;" onclick="fillFormWithVehicle(${vehicle.id})">
          Inspect
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ==============================================
// البحث والفلترة
// ==============================================

function searchVehicle() {
  const searchInput = document.getElementById('searchVehicle').value.toLowerCase();
  const filterDiv = document.getElementById('filterDiv').value;
  
  let filtered = vehiclesData.filter(vehicle => {
    const matchesSearch = searchInput === '' || 
                         String(vehicle.doorNo).toLowerCase().includes(searchInput) ||
                         String(vehicle.plateNo).toLowerCase().includes(searchInput);
    const matchesDiv = filterDiv === '' || vehicle.division === filterDiv;
    return matchesSearch && matchesDiv;
  });
  
  populateVehicleTable(filtered);
}

// ==============================================
// ملء النموذج بمعلومات السيارة
// ==============================================

function fillFormWithVehicle(vehicleId) {
  const vehicle = vehiclesData.find(v => v.id === vehicleId);
  if (!vehicle) return;
  
  // حفظ السيارة المختارة
  selectedVehicleId = vehicleId;
  
  // الانتقال إلى تبويب الفحص
  switchTab('inspection');
  
  // ملء الحقول الأساسية
  document.getElementById('doorNo').value = vehicle.doorNo || '';
  document.getElementById('plateNo').value = vehicle.plateNo || '';
  document.getElementById('divUnit').value = vehicle.division || '';
  document.getElementById('vehicleType').value = vehicle.vehicleType || '';
  
  // ملء Vehicle Size
  if (vehicle.vehicleSize) {
    const sizeRadio = document.getElementById('size_' + vehicle.vehicleSize.replace('-', '_'));
    if (sizeRadio) {
      sizeRadio.checked = true;
      updateOffroadItems();
    }
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==============================================
// إدارة التبويبات
// ==============================================

function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // إخفاء جميع التبويبات
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // إزالة active من جميع الأزرار
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // إظهار التبويب المطلوب
  const targetTab = document.getElementById(tabName + '-tab');
  if (targetTab) {
    targetTab.classList.add('active');
  }
  
  // تفعيل الزر المطلوب
  const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
  if (targetButton) {
    targetButton.classList.add('active');
  }
}

// ==============================================
// تحديث عناصر Off-Road
// ==============================================

function updateOffroadItems() {
  const offroadRadio = document.getElementById('size_4x4_offroad');
  const offroadItems = document.querySelectorAll('.offroad-only');
  
  if (offroadRadio && offroadRadio.checked) {
    offroadItems.forEach(item => item.classList.add('show'));
  } else {
    offroadItems.forEach(item => item.classList.remove('show'));
  }
}

// ==============================================
// التحقق من صحة النموذج
// ==============================================

function initializeFormValidation() {
  const form = document.querySelector('form');
  if (!form) return;
  
  // مراقبة تغيير Vehicle Size
  const sizeRadios = document.querySelectorAll('input[name="vehicleSize"]');
  sizeRadios.forEach(radio => {
    radio.addEventListener('change', updateOffroadItems);
  });
  
  // معالجة إرسال النموذج
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // التحقق من الحقول المطلوبة
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!validateField(field)) {
        isValid = false;
      }
    });
    
    if (isValid) {
      const success = await saveInspection(form);
      if (success) {
        showSuccessMessage('تم حفظ الفحص بنجاح في قاعدة البيانات!');
        form.reset();
      } else {
        alert('⚠️ حدث خطأ في حفظ الفحص');
      }
    } else {
      alert('⚠️ يرجى ملء جميع الحقول المطلوبة');
    }
  });
}

function validateField(field) {
  if (field.type === 'radio') {
    const radioGroup = document.querySelectorAll(`input[name="${field.name}"]`);
    return Array.from(radioGroup).some(radio => radio.checked);
  }
  
  const isHidden = field.closest('.offroad-only') && 
                  !field.closest('.offroad-only').classList.contains('show');
  if (isHidden) {
    return true;
  }
  
  const isEmpty = !field.value || field.value.trim() === '';
  const isSelectEmpty = field.tagName === 'SELECT' && (field.value === '' || field.value === 'Select...');
  
  return !(isEmpty || isSelectEmpty);
}

// ==============================================
// حفظ الفحص الجديد
// ==============================================

async function saveInspection(form) {
  const formData = new FormData(form);
  
  // البحث عن السيارة لربط الفحص بها
  const doorNo = formData.get('doorNo');
  const vehicle = vehiclesData.find(v => String(v.doorNo) === String(doorNo));
  const vehicleId = vehicle ? vehicle.id : selectedVehicleId;
  
  // حساب عدد المشاكل
  let issuesFound = 0;
  let hasActionRequired = false;
  
  // جمع بيانات معدات السلامة
  const safetyEquipment = {};
  const conditionFields = [
    'eq_windshield_wipers', 'eq_reflective_triangles', 'eq_foot_brakes', 'eq_emergency_brakes',
    'eq_horn', 'eq_tire_changing_kit', 'eq_tires', 'eq_spare_tire', 'eq_wheels', 'eq_jm_flyer',
    'eq_emergency_contact', 'eq_shovel', 'eq_sand_boards', 'eq_towing_cable', 'eq_shackles',
    'eq_tire_gauge', 'eq_air_compressor', 'eq_flash'
  ];
  
  conditionFields.forEach(field => {
    const condition = formData.get(field) || 'OK';
    const observation = formData.get(`${field}_note`) || '';
    
    safetyEquipment[field] = {
      condition: condition,
      observation: observation
    };
    
    if (condition === 'Action Required') {
      issuesFound++;
      hasActionRequired = true;
    }
  });
  
  const newInspection = {
    inspectionId: `INS-2026-${String(inspectionsData.length + 1).padStart(3, '0')}`,
    vehicleId: vehicleId,
    doorNo: formData.get('doorNo'),
    plateNo: formData.get('plateNo'),
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectorName: formData.get('inspName'),
    inspectorId: formData.get('inspId'),
    supervisorName: formData.get('supName'),
    supervisorId: formData.get('supId'),
    safetyEquipment: JSON.stringify(safetyEquipment),
    overallStatus: hasActionRequired ? 'Action Required' : 'Passed',
    issuesFound: issuesFound,
    actionRequired: hasActionRequired
  };
  
  // حفظ في الخادم
  const success = await addInspectionToServer(newInspection);
  
  if (success) {
    // تحديث البيانات المحلية
    await loadInspectionsData();
    await loadAnalyticsData();
    
    // تحديث العرض
    populateVehicleTable();
    updateDashboard();
    
    selectedVehicleId = null;
    return true;
  }
  
  return false;
}

// ==============================================
// تحديث Dashboard
// ==============================================

function updateDashboard() {
  const totalVehicles = vehiclesData.length;
  
  // حساب السيارات المفحوصة هذا الشهر
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const inspectedThisMonth = inspectionsData.filter(insp => {
    const inspDate = new Date(insp.inspectionDate);
    return inspDate.getMonth() === currentMonth && inspDate.getFullYear() === currentYear;
  }).length;
  
  // حساب السيارات المفحوصة (فريدة)
  const inspectedVehicleIds = new Set(inspectionsData.map(i => i.vehicleId));
  const totalInspected = inspectedVehicleIds.size;
  const pendingInspection = totalVehicles - totalInspected;
  
  // تحديث الأرقام في Dashboard
  const dashboardBoxes = document.querySelectorAll('#dashboard-tab .box h3');
  if (dashboardBoxes.length >= 3) {
    dashboardBoxes[0].textContent = totalVehicles;
    dashboardBoxes[1].textContent = inspectedThisMonth;
    dashboardBoxes[2].textContent = pendingInspection;
  }
}

// ==============================================
// إدارة السيارات - إضافة/حذف
// ==============================================

function populateRemoveDropdown() {
  const select = document.getElementById('removeDoorNo');
  if (!select) return;
  
  select.innerHTML = '<option value="">Select vehicle...</option>';
  
  vehiclesData.forEach(vehicle => {
    const option = document.createElement('option');
    option.value = vehicle.id;
    option.textContent = `${vehicle.doorNo} - ${vehicle.plateNo}`;
    select.appendChild(option);
  });
}

// إضافة سيارة جديدة
async function addVehicle() {
  const doorNo = document.getElementById('newDoorNo').value;
  const plateNo = document.getElementById('newPlateNo').value;
  const division = document.getElementById('newDiv').value;
  
  if (!doorNo || !plateNo) {
    alert('⚠️ يرجى إدخال رقم الباب ورقم اللوحة');
    return;
  }
  
  const newVehicle = {
    id: Date.now(),
    doorNo: doorNo,
    plateNo: plateNo,
    division: division || 'General',
    vehicleType: 'N/A',
    vehicleSize: '4x2'
  };
  
  // حفظ في الخادم
  const success = await addVehicleToServer(newVehicle);
  
  if (success) {
    // تحديث البيانات المحلية
    await loadVehiclesData();
    
    // تحديث العرض
    populateVehicleTable();
    populateRemoveDropdown();
    updateDashboard();
    
    // مسح الحقول
    document.getElementById('newDoorNo').value = '';
    document.getElementById('newPlateNo').value = '';
    document.getElementById('newDiv').value = '';
    
    showSuccessMessage('تمت إضافة السيارة بنجاح في قاعدة البيانات!');
  } else {
    alert('⚠️ حدث خطأ في إضافة السيارة');
  }
}

// حذف سيارة
async function removeVehicle() {
  const select = document.getElementById('removeDoorNo');
  const vehicleId = parseInt(select.value);
  
  if (!vehicleId) {
    alert('⚠️ يرجى اختيار سيارة للحذف');
    return;
  }
  
  if (confirm('هل أنت متأكد من حذف هذه السيارة من قاعدة البيانات؟\nلن تتمكن من التراجع عن هذا الإجراء!')) {
    // حذف من الخادم
    const success = await deleteVehicleFromServer(vehicleId);
    
    if (success) {
      // تحديث البيانات المحلية
      await loadVehiclesData();
      
      // تحديث العرض
      populateVehicleTable();
      populateRemoveDropdown();
      updateDashboard();
      
      showSuccessMessage('تم حذف السيارة بنجاح من قاعدة البيانات!');
    } else {
      alert('⚠️ حدث خطأ في حذف السيارة');
    }
  }
}

// ==============================================
// ربط الأزرار بالوظائف
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
  const addBtn = document.querySelector('#management-tab .btn.primary');
  if (addBtn) {
    addBtn.addEventListener('click', addVehicle);
  }
  
  const removeBtn = document.querySelector('#management-tab .btn:not(.primary)');
  if (removeBtn) {
    removeBtn.addEventListener('click', removeVehicle);
  }
});
