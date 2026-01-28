// ==============================================
// قراءة البيانات من ملفات Excel/CSV
// ==============================================

let vehiclesData = [];
let inspectionsData = [];
let analyticsData = {};
let selectedVehicleId = null;

// مكتبة SheetJS للتعامل مع Excel يتم تحميلها من CDN في HTML

// تحميل بيانات السيارات من Excel/CSV
async function loadVehiclesData() {
  try {
    // محاولة قراءة من Excel أولاً
    console.log('🔄 جاري تحميل بيانات السيارات...');
    
    try {
      const response = await fetch('vehicle_inspection_database.xlsx');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // قراءة Sheet الأول (Vehicles)
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        vehiclesData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('✅ تم تحميل بيانات السيارات من Excel:', vehiclesData.length, 'سيارة');
        return true;
      }
    } catch (excelError) {
      console.log('ℹ️ Excel غير متوفر، محاولة قراءة CSV...');
    }
    
    // إذا لم يتوفر Excel، محاولة قراءة من CSV
    const csvResponse = await fetch('vehicles_data.csv');
    if (!csvResponse.ok) {
      throw new Error('لم يتم العثور على ملف البيانات');
    }
    
    const csvText = await csvResponse.text();
    vehiclesData = parseCSV(csvText);
    
    console.log('✅ تم تحميل بيانات السيارات من CSV:', vehiclesData.length, 'سيارة');
    return true;
    
  } catch (error) {
    console.error('❌ خطأ في تحميل بيانات السيارات:', error);
    alert('⚠️ فشل تحميل بيانات السيارات.\n\nيرجى التأكد من وجود أحد الملفات التالية:\n- vehicle_inspection_database.xlsx\n- vehicles_data.csv');
    vehiclesData = [];
    return false;
  }
}

// تحميل بيانات الفحوصات من Excel/CSV
async function loadInspectionsData() {
  try {
    console.log('🔄 جاري تحميل بيانات الفحوصات...');
    
    try {
      // محاولة قراءة من Excel أولاً
      const response = await fetch('vehicle_inspection_database.xlsx');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // قراءة Sheet الثاني (Inspections)
        if (workbook.SheetNames.length > 1) {
          const sheetName = workbook.SheetNames[1];
          const worksheet = workbook.Sheets[sheetName];
          inspectionsData = XLSX.utils.sheet_to_json(worksheet);
          
          // قراءة الإحصائيات من Sheet الثالث
          if (workbook.SheetNames.length > 2) {
            const analyticsSheet = workbook.SheetNames[2];
            const analyticsWorksheet = workbook.Sheets[analyticsSheet];
            const analyticsJson = XLSX.utils.sheet_to_json(analyticsWorksheet);
            if (analyticsJson.length > 0) {
              analyticsData = { summary: analyticsJson[0] };
            }
          }
          
          console.log('✅ تم تحميل بيانات الفحوصات من Excel:', inspectionsData.length, 'فحص');
          return true;
        }
      }
    } catch (excelError) {
      console.log('ℹ️ Excel غير متوفر، محاولة قراءة CSV...');
    }
    
    // إذا لم يتوفر Excel، محاولة قراءة من CSV
    const csvResponse = await fetch('inspections_data.csv');
    if (!csvResponse.ok) {
      throw new Error('لم يتم العثور على ملف البيانات');
    }
    
    const csvText = await csvResponse.text();
    inspectionsData = parseCSV(csvText);
    
    // محاولة قراءة الإحصائيات
    try {
      const analyticsResponse = await fetch('analytics_data.csv');
      if (analyticsResponse.ok) {
        const analyticsText = await analyticsResponse.text();
        const analyticsArray = parseCSV(analyticsText);
        if (analyticsArray.length > 0) {
          analyticsData = { summary: analyticsArray[0] };
        }
      }
    } catch (e) {
      console.warn('ℹ️ لم يتم العثور على ملف الإحصائيات');
      // إنشاء إحصائيات افتراضية
      analyticsData = { summary: {
        totalInspections: inspectionsData.length,
        passedInspections: 0,
        actionRequiredInspections: 0,
        totalVehiclesInspected: 0,
        totalVehiclesNotInspected: vehiclesData.length
      }};
    }
    
    console.log('✅ تم تحميل بيانات الفحوصات من CSV:', inspectionsData.length, 'فحص');
    return true;
    
  } catch (error) {
    console.error('❌ خطأ في تحميل بيانات الفحوصات:', error);
    alert('⚠️ فشل تحميل بيانات الفحوصات.\n\nيرجى التأكد من وجود أحد الملفات التالية:\n- vehicle_inspection_database.xlsx\n- inspections_data.csv');
    inspectionsData = [];
    analyticsData = {};
    return false;
  }
}

// دالة مساعدة لتحليل CSV
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return [];
  
  // تحليل السطر الأول (الرأس)
  const headers = parseCSVLine(lines[0]);
  const data = [];
  
  // تحليل باقي الأسطر
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // تجاهل الأسطر الفارغة
    
    const values = parseCSVLine(lines[i]);
    const row = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      
      // تنظيف القيمة
      value = value.trim();
      
      // محاولة تحويل الأرقام
      if (!isNaN(value) && value !== '' && value !== 'NaN') {
        value = Number(value);
      }
      // محاولة تحويل القيم المنطقية
      else if (value.toLowerCase() === 'true') {
        value = true;
      } else if (value.toLowerCase() === 'false') {
        value = false;
      }
      
      row[header] = value;
    });
    
    data.push(row);
  }
  
  return data;
}

// دالة لتحليل سطر CSV مع دعم الفواصل داخل علامات الاقتباس
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// ==============================================
// تهيئة الصفحة
// ==============================================

document.addEventListener("DOMContentLoaded", async function() {
  // عرض رسالة تحميل
  showLoadingMessage();
  
  // تحميل البيانات من الملفات
  const vehiclesLoaded = await loadVehiclesData();
  const inspectionsLoaded = await loadInspectionsData();
  
  // إخفاء رسالة التحميل
  hideLoadingMessage();
  
  // التحقق من نجاح التحميل
  if (!vehiclesLoaded || !inspectionsLoaded) {
    showErrorMessage('فشل تحميل قواعد البيانات. يرجى التأكد من وجود الملفات المطلوبة');
    return;
  }
  
  // تهيئة العناصر
  populateVehicleTable();
  initializeTabs();
  initializeFormValidation();
  updateDashboard();
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
  loadingDiv.innerHTML = '⏳ جاري تحميل قواعد البيانات... <small style="display:block; margin-top:5px; opacity:0.9;">Loading from Excel/CSV files</small>';
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
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-light);">
          <strong>لا توجد سيارات في قاعدة البيانات</strong><br/><br/>
          يرجى التأكد من وجود بيانات في ملف Excel أو CSV
        </td>
      </tr>
    `;
    return;
  }
  
  dataToShow.forEach(vehicle => {
    // البحث عن آخر فحص للسيارة
    const lastInspection = inspectionsData
      .filter(insp => insp.vehicleId === vehicle.id)
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
      <td style="font-weight: 600;">${vehicle.doorNo}</td>
      <td>${vehicle.plateNo}</td>
      <td>${vehicle.division}</td>
      <td>${vehicle.vehicleType}</td>
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
  document.getElementById('doorNo').value = vehicle.doorNo;
  document.getElementById('plateNo').value = vehicle.plateNo;
  document.getElementById('divUnit').value = vehicle.division + (vehicle.unit ? ' / ' + vehicle.unit : '');
  
  // ملء Vehicle Type (dropdown)
  document.getElementById('vehicleType').value = vehicle.vehicleType;
  
  // ملء Vehicle Size (radio buttons)
  if (vehicle.vehicleSize) {
    let sizeId = '';
    
    if (vehicle.vehicleSize === '4x2') {
      sizeId = 'size_4x2';
    } else if (vehicle.vehicleSize === '4x4-offroad') {
      sizeId = 'size_4x4_offroad';
    } else if (vehicle.vehicleSize === '4x4-nonoffroad') {
      sizeId = 'size_4x4_non';
    }
    
    const sizeRadio = document.getElementById(sizeId);
    if (sizeRadio) {
      sizeRadio.checked = true;
      // تفعيل حدث التغيير لإظهار/إخفاء عناصر Off-Road
      sizeRadio.dispatchEvent(new Event('change'));
    }
  }
  
  // ملء الحقول الاختيارية
  if (vehicle.odometer) {
    document.getElementById('odometer').value = vehicle.odometer;
  }
  
  if (vehicle.inspectionStickerMileage) {
    document.getElementById('inspMileage').value = vehicle.inspectionStickerMileage;
  }
  
  if (vehicle.inspectionStickerDate) {
    document.getElementById('inspDate').value = vehicle.inspectionStickerDate;
  }
  
  // التمرير للنموذج
  setTimeout(() => {
    document.querySelector('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
  
  console.log('✅ تم تعبئة معلومات السيارة:', vehicle.doorNo, '-', vehicle.vehicleType, '-', vehicle.vehicleSize);
}

// ==============================================
// نظام التبويبات
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
  // تحديث الأزرار
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    }
  });
  
  // تحديث المحتوى
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  const targetTab = document.getElementById(`${tabName}-tab`);
  if (targetTab) {
    targetTab.classList.add('active');
  }
  
  // تحديث المحتوى حسب التبويب
  if (tabName === 'history') {
    updateHistoryTab();
  } else if (tabName === 'dashboard') {
    updateDashboard();
  } else if (tabName === 'management') {
    populateRemoveDropdown();
  }
}

// ==============================================
// تحديث تبويب السجل
// ==============================================

function updateHistoryTab() {
  const historyBody = document.querySelector('#history-tab .checklist tbody');
  if (!historyBody) return;
  
  historyBody.innerHTML = '';
  
  // إذا ما في سيارة مختارة
  if (!selectedVehicleId) {
    historyBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px;">
          No vehicle selected. Please select a vehicle from the list above.
        </td>
      </tr>
    `;
    return;
  }
  
  // البحث عن السيارة المختارة
  const selectedVehicle = vehiclesData.find(v => v.id === selectedVehicleId);
  
  // فلترة الفحوصات للسيارة المختارة فقط
  const vehicleInspections = inspectionsData
    .filter(insp => insp.vehicleId === selectedVehicleId)
    .sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate));
  
  // إذا ما في فحوصات
  if (vehicleInspections.length === 0) {
    historyBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px;">
          <strong>Vehicle: Door #${selectedVehicle.doorNo} (${selectedVehicle.plateNo})</strong><br/><br/>
          No inspection history found for this vehicle.
        </td>
      </tr>
    `;
    return;
  }
  
  // عرض الفحوصات
  vehicleInspections.forEach(inspection => {
    const statusColor = inspection.overallStatus === 'Passed' ? 'var(--success)' : 'var(--warning)';
    const statusIcon = inspection.overallStatus === 'Passed' ? '✓' : '⚠';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${inspection.inspectionDate}</td>
      <td>${inspection.inspectorName} (${inspection.inspectorId})</td>
      <td><span style="color: ${statusColor}; font-weight: 600;">${statusIcon} ${inspection.overallStatus}</span></td>
      <td>${inspection.issuesFound} issues</td>
      <td>
        <button type="button" class="btn" style="padding: 6px 12px; font-size: 12px;" onclick="viewInspectionDetails('${inspection.inspectionId}')">
          View Details
        </button>
      </td>
    `;
    historyBody.appendChild(row);
  });
}

function viewInspectionDetails(inspectionId) {
  const inspection = inspectionsData.find(i => i.inspectionId === inspectionId);
  if (!inspection) return;
  
  alert(`📋 Inspection Details:\n\nID: ${inspection.inspectionId}\nVehicle: Door #${inspection.doorNo} (${inspection.plateNo})\nDate: ${inspection.inspectionDate}\nStatus: ${inspection.overallStatus}\nIssues: ${inspection.issuesFound}\n\nInspector: ${inspection.inspectorName}`);
}

// ==============================================
// تحديث لوحة التحكم
// ==============================================

function updateDashboard() {
  if (!analyticsData.summary) return;
  
  const summary = analyticsData.summary;
  
  // تحديث الإحصائيات
  const statsBoxes = document.querySelectorAll('#dashboard-tab .box h3');
  if (statsBoxes.length >= 3) {
    statsBoxes[0].textContent = vehiclesData.length;
    statsBoxes[1].textContent = summary.totalVehiclesInspected || 0;
    statsBoxes[2].textContent = summary.totalVehiclesNotInspected || 0;
  }
  
  // تحديث النشاط الأخير
  const activityBody = document.querySelector('#dashboard-tab .checklist tbody');
  if (activityBody && inspectionsData.length > 0) {
    activityBody.innerHTML = '';
    
    const recentInspections = inspectionsData
      .sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate))
      .slice(0, 5);
    
    recentInspections.forEach(inspection => {
      const statusColor = inspection.overallStatus === 'Passed' ? 'var(--success)' : 'var(--warning)';
      const statusIcon = inspection.overallStatus === 'Passed' ? '✓' : '⚠';
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${inspection.inspectionDate}</td>
        <td>Door #${inspection.doorNo} (${inspection.plateNo})</td>
        <td>${inspection.inspectorName} (ID: ${inspection.inspectorId})</td>
        <td><span style="color: ${statusColor}; font-weight: 600;">${statusIcon} ${inspection.overallStatus}</span></td>
      `;
      activityBody.appendChild(row);
    });
  }
}

// ==============================================
// التحقق من صحة النموذج
// ==============================================

const vehicleSizeRadios = document.querySelectorAll('input[name="vehicleSize"]');
const offroadItems = document.querySelectorAll('.offroad-only');
const offroadSelects = document.querySelectorAll('.offroad-only select');

function initializeFormValidation() {
  const form = document.querySelector("form");
  if (!form) return;
  
  const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
  const conditionSelects = document.querySelectorAll(".checklist select");

  // التحكم في عناصر Off-Road
  vehicleSizeRadios.forEach(radio => {
    radio.addEventListener('change', function () {
      const isOffroad = (this.value === '4x4-offroad');
      
      offroadItems.forEach(item => {
        if (isOffroad) {
          item.classList.add('show');
        } else {
          item.classList.remove('show');
        }
      });

      offroadSelects.forEach(select => {
        if (isOffroad) {
          select.setAttribute("required", "required");
        } else {
          select.removeAttribute("required");
          select.value = "";
          select.classList.remove('show-error', 'show-success');
        }
      });
    });
  });

  // التحكم في حقل Observation
  conditionSelects.forEach(select => {
    select.addEventListener("change", function () {
      const observationInput = this.closest("tr").querySelector("input[name$='_note']");

      if (this.value === "Action Required") {
        observationInput.setAttribute("required", "required");
        observationInput.placeholder = "Please describe the issue...";
      } else {
        observationInput.removeAttribute("required");
        observationInput.placeholder = "...";
        observationInput.value = "";
        observationInput.classList.remove('show-error', 'show-success');
      }
      
      if (observationInput.classList.contains('show-error')) {
        validateField(observationInput);
      }
    });
  });

  // التحقق عند فقدان التركيز
  inputs.forEach(input => {
    input.addEventListener('blur', function() {
      if (this.hasAttribute('required')) {
        validateField(this);
      }
    });

    input.addEventListener('input', function() {
      if (this.classList.contains('show-error')) {
        validateField(this);
      }
    });

    input.addEventListener('change', function() {
      if (this.classList.contains('show-error') && this.hasAttribute('required')) {
        validateField(this);
      }
    });
  });

  // التحقق عند إرسال النموذج
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    let isValid = true;
    let firstErrorField = null;

    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
      const isHidden = field.closest('.offroad-only') && 
                      !field.closest('.offroad-only').classList.contains('show');
      
      if (!isHidden) {
        if (!validateField(field)) {
          isValid = false;
          if (!firstErrorField) {
            firstErrorField = field;
          }
          
          field.classList.add('shake-error');
          setTimeout(() => {
            field.classList.remove('shake-error');
          }, 300);
        }
      }
    });

    if (isValid) {
      console.log('✅ النموذج صحيح - يمكن الإرسال');
      saveInspection(form);
      alert('تم إرسال النموذج بنجاح! ✅');
    } else {
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          firstErrorField.focus();
        }, 500);
      }
      
      alert('⚠️ يرجى تعبئة جميع الحقول المطلوبة (المحددة بنجمة حمراء *)');
    }
  });

  function validateField(field) {
    if (field.type === 'radio') {
      const radioGroup = form.querySelectorAll(`input[name="${field.name}"]`);
      const isChecked = Array.from(radioGroup).some(radio => radio.checked);
      
      radioGroup.forEach(radio => {
        if (isChecked) {
          radio.classList.remove('show-error');
          radio.classList.add('show-success');
        } else {
          radio.classList.add('show-error');
          radio.classList.remove('show-success');
        }
      });
      
      return isChecked;
    }

    const isHidden = field.closest('.offroad-only') && 
                    !field.closest('.offroad-only').classList.contains('show');
    if (isHidden) {
      return true;
    }

    const isEmpty = !field.value || field.value.trim() === '';
    const isSelectEmpty = field.tagName === 'SELECT' && (field.value === '' || field.value === 'Select...');
    
    if ((isEmpty || isSelectEmpty) && field.hasAttribute('required')) {
      field.classList.add('show-error');
      field.classList.remove('show-success');
      return false;
    } else if (!isEmpty && !isSelectEmpty) {
      field.classList.remove('show-error');
      field.classList.add('show-success');
      return true;
    } else {
      field.classList.remove('show-error', 'show-success');
      return true;
    }
  }
}

// ==============================================
// حفظ الفحص الجديد
// ==============================================

function saveInspection(form) {
  const formData = new FormData(form);
  
  // البحث عن السيارة لربط الفحص بها
  const doorNo = formData.get('doorNo');
  const vehicle = vehiclesData.find(v => String(v.doorNo) === String(doorNo));
  const vehicleId = vehicle ? vehicle.id : selectedVehicleId;
  
  // حساب عدد المشاكل من حقول Condition
  let issuesFound = 0;
  let hasActionRequired = false;
  
  // جمع بيانات معدات السلامة
  const safetyEquipment = {};
  const conditionFields = [
    'windshieldWipers', 'reflectiveTriangles', 'footBrakes', 'emergencyBrakes',
    'horn', 'tireChangingKit', 'tires', 'spareTire', 'wheels', 'jmFlyer',
    'emergencyContactList', 'shovel', 'sandBoards', 'towingCable', 'shackles',
    'tireGauge', 'airCompressor', 'flashlight'
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
  
  // جمع بيانات حالة السيارة
  const vehicleCondition = {
    inside: [],
    outside: [],
    observation: formData.get('vehicle_obs') || ''
  };
  
  // فحص العناصر الداخلية
  const insideItems = ['rearview-mirror', 'head-lights', 'windshields', 'side-windows'];
  insideItems.forEach(item => {
    if (formData.get(item) === 'on') {
      vehicleCondition.inside.push(item);
    }
  });
  
  // فحص العناصر الخارجية
  const outsideItems = ['rearview-mirrors', 'brake-lights', 'taillights', 'turn-signal'];
  outsideItems.forEach(item => {
    if (formData.get(item) === 'on') {
      vehicleCondition.outside.push(item);
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
    vehicleCondition: vehicleCondition,
    safetyEquipment: safetyEquipment,
    overallStatus: hasActionRequired ? 'Action Required' : 'Passed',
    issuesFound: issuesFound,
    actionRequired: hasActionRequired
  };
  
  // إضافة الفحص للبيانات
  inspectionsData.push(newInspection);
  
  // تحديث الإحصائيات
  if (analyticsData.summary) {
    analyticsData.summary.totalInspections = inspectionsData.length;
    analyticsData.summary.passedInspections = inspectionsData.filter(i => i.overallStatus === 'Passed').length;
    analyticsData.summary.actionRequiredInspections = inspectionsData.filter(i => i.overallStatus === 'Action Required').length;
    
    const inspectedVehicleIds = new Set(inspectionsData.map(i => i.vehicleId));
    analyticsData.summary.totalVehiclesInspected = inspectedVehicleIds.size;
    analyticsData.summary.totalVehiclesNotInspected = vehiclesData.length - inspectedVehicleIds.size;
  }
  
  console.log('💾 تم حفظ الفحص:', newInspection);
  
  // تحديث العرض
  populateVehicleTable();
  updateDashboard();
  
  // إعادة تعيين النموذج
  form.reset();
  selectedVehicleId = null;
}

// ==============================================
// إدارة السيارات - Car Management
// ==============================================

function populateRemoveDropdown() {
  const dropdown = document.getElementById('removeDoorNo');
  if (!dropdown) return;
  
  dropdown.innerHTML = '<option value="">Select vehicle...</option>';
  
  vehiclesData.forEach(vehicle => {
    const option = document.createElement('option');
    option.value = vehicle.id;
    option.textContent = `Door #${vehicle.doorNo} - ${vehicle.plateNo} (${vehicle.division})`;
    dropdown.appendChild(option);
  });
}

function addNewVehicle() {
  const doorNo = document.getElementById('newDoorNo').value.trim();
  const plateNo = document.getElementById('newPlateNo').value.trim();
  const division = document.getElementById('newDiv').value.trim();
  const vehicleType = document.getElementById('newVehicleType').value;
  const vehicleSize = document.getElementById('newVehicleSize').value;
  
  if (!doorNo || !plateNo || !division || !vehicleType || !vehicleSize) {
    alert('⚠️ Please fill in all required fields!');
    return;
  }
  
  if (vehiclesData.some(v => String(v.doorNo) === String(doorNo))) {
    alert('⚠️ Door number already exists!');
    return;
  }
  
  if (vehiclesData.some(v => v.plateNo === plateNo)) {
    alert('⚠️ Plate number already exists!');
    return;
  }
  
  const newId = vehiclesData.length > 0 ? Math.max(...vehiclesData.map(v => v.id)) + 1 : 1;
  
  const newVehicle = {
    id: newId,
    doorNo: doorNo,
    plateNo: plateNo,
    division: division,
    unit: '',
    vehicleType: vehicleType,
    vehicleSize: vehicleSize,
    odometer: 0,
    inspectionStickerMileage: 0,
    inspectionStickerDate: '',
    restrictedAreaSticker: 'no',
    stickerExpiryDate: null,
    assignedTo: null,
    assignedDate: null,
    status: 'Active'
  };
  
  vehiclesData.push(newVehicle);
  
  populateVehicleTable();
  populateRemoveDropdown();
  updateDashboard();
  
  document.getElementById('newDoorNo').value = '';
  document.getElementById('newPlateNo').value = '';
  document.getElementById('newDiv').value = '';
  document.getElementById('newVehicleType').value = '';
  document.getElementById('newVehicleSize').value = '';
  
  alert('✅ Vehicle added successfully!');
  console.log('✅ تم إضافة السيارة:', newVehicle);
}

function removeVehicle() {
  const vehicleId = parseInt(document.getElementById('removeDoorNo').value);
  
  if (!vehicleId) {
    alert('⚠️ Please select a vehicle to remove!');
    return;
  }
  
  const vehicle = vehiclesData.find(v => v.id === vehicleId);
  if (!vehicle) {
    alert('❌ Vehicle not found!');
    return;
  }
  
  const confirmDelete = confirm(`Are you sure you want to remove:\n\nDoor #${vehicle.doorNo} - ${vehicle.plateNo}\nDivision: ${vehicle.division}\nType: ${vehicle.vehicleType}`);
  
  if (!confirmDelete) return;
  
  const index = vehiclesData.findIndex(v => v.id === vehicleId);
  if (index > -1) {
    vehiclesData.splice(index, 1);
    
    populateVehicleTable();
    populateRemoveDropdown();
    updateDashboard();
    
    document.getElementById('removeDoorNo').value = '';
    
    alert('✅ Vehicle removed successfully!');
    console.log('🗑️ تم حذف السيارة:', vehicle.doorNo);
  }
}
