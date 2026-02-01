from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pandas as pd
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # للسماح بالاتصال من المتصفح

# تحديد المسار التلقائي للمجلد الحالي
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# دمج المسار مع اسم الملف (تأكد أن الاسم مطابق تماماً لملفك)
EXCEL_FILE = os.path.join(BASE_DIR, 'vehicle_inspection_database.xlsx')
# التأكد من وجود الملف
if not os.path.exists(EXCEL_FILE):
    # إنشاء ملف جديد إذا لم يكن موجوداً
    df_vehicles = pd.DataFrame(columns=['id', 'doorNo', 'plateNo', 'division', 'vehicleType', 'vehicleSize'])
    df_inspections = pd.DataFrame(columns=['inspectionId', 'vehicleId', 'doorNo', 'plateNo', 'inspectionDate', 
                                           'inspectorName', 'inspectorId', 'supervisorName', 'supervisorId', 
                                           'overallStatus', 'issuesFound'])
    df_analytics = pd.DataFrame(columns=['totalVehicles', 'totalInspections', 'passedInspections', 
                                        'actionRequiredInspections'])
    
    with pd.ExcelWriter(EXCEL_FILE, engine='openpyxl') as writer:
        df_vehicles.to_excel(writer, sheet_name='Vehicles', index=False)
        df_inspections.to_excel(writer, sheet_name='Inspections', index=False)
        df_analytics.to_excel(writer, sheet_name='Analytics', index=False)


@app.route('/')
def home():
    return render_template('index.html') 
# 1. جلب جميع السيارات
@app.route('/get_vehicles', methods=['GET'])
def get_vehicles():
    try:
        df = pd.read_excel(EXCEL_FILE, sheet_name='Vehicles')
        # تحويل NaN إلى قيم فارغة
        df = df.fillna('')
        return jsonify(df.to_dict('records'))
    except Exception as e:
        print(f"Error reading vehicles: {e}")
        return jsonify([])

# 2. جلب جميع الفحوصات
@app.route('/get_inspections', methods=['GET'])
def get_inspections():
    try:
        df = pd.read_excel(EXCEL_FILE, sheet_name='Inspections')
        df = df.fillna('')
        return jsonify(df.to_dict('records'))
    except Exception as e:
        print(f"Error reading inspections: {e}")
        return jsonify([])

# 3. جلب الإحصائيات
@app.route('/get_analytics', methods=['GET'])
def get_analytics():
    try:
        df = pd.read_excel(EXCEL_FILE, sheet_name='Analytics')
        if len(df) > 0:
            return jsonify(df.to_dict('records')[0])
        else:
            return jsonify({})
    except Exception as e:
        print(f"Error reading analytics: {e}")
        return jsonify({})

# 4. إضافة سيارة جديدة
def save_all_sheets(vehicles_df):
    """دالة مساعدة لحفظ جميع الأوراق وضمان عدم ضياع البيانات"""
    # نقرأ الأوراق الأخرى أولاً قبل البدء بعملية الحفظ
    inspections_df = pd.read_excel(EXCEL_FILE, sheet_name='Inspections')
    try:
        analytics_df = pd.read_excel(EXCEL_FILE, sheet_name='Analytics')
    except:
        analytics_df = pd.DataFrame() # إذا لم تكن موجودة ننشئ إطار فارغ

    # الآن نحفظ كل شيء دفعة واحدة
    with pd.ExcelWriter(EXCEL_FILE, engine='openpyxl') as writer:
        vehicles_df.to_excel(writer, sheet_name='Vehicles', index=False)
        inspections_df.to_excel(writer, sheet_name='Inspections', index=False)
        if not analytics_df.empty:
            analytics_df.to_excel(writer, sheet_name='Analytics', index=False)

@app.route('/add_vehicle', methods=['POST'])
def add_vehicle():
    try:
        new_data = request.json
        df = pd.read_excel(EXCEL_FILE, sheet_name='Vehicles')
        
        # إضافة السطر الجديد
        df = pd.concat([df, pd.DataFrame([new_data])], ignore_index=True)
        
        # حفظ كل الأوراق
        save_all_sheets(df)
        
        return jsonify({"success": True, "message": "تمت إضافة السيارة بنجاح"})
    except Exception as e:
        print(f"Error adding vehicle: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/delete_vehicle/<int:vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    try:
        df = pd.read_excel(EXCEL_FILE, sheet_name='Vehicles')
        
        # التأكد من حذف السطر الصحيح (حسب عمود id)
        df = df[df['id'] != vehicle_id]
        
        # حفظ كل الأوراق
        save_all_sheets(df)
        
        return jsonify({"success": True, "message": "تم حذف السيارة بنجاح"})
    except Exception as e:
        print(f"Error deleting vehicle: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
# 6. إضافة فحص جديد
@app.route('/add_inspection', methods=['POST'])
def add_inspection():
    try:
        new_inspection = request.json
        df = pd.read_excel(EXCEL_FILE, sheet_name='Inspections')
        
        # إضافة الفحص الجديد
        df = pd.concat([df, pd.DataFrame([new_inspection])], ignore_index=True)
        
        # تحديث الإحصائيات
        df_analytics = update_analytics()
        
        # حفظ الملف
        with pd.ExcelWriter(EXCEL_FILE, engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
            # حفظ السيارات
            df_vehicles = pd.read_excel(EXCEL_FILE, sheet_name='Vehicles')
            df_vehicles.to_excel(writer, sheet_name='Vehicles', index=False)
            
            # حفظ الفحوصات
            df.to_excel(writer, sheet_name='Inspections', index=False)
            
            # حفظ الإحصائيات
            df_analytics.to_excel(writer, sheet_name='Analytics', index=False)
        
        return jsonify({"success": True, "message": "تم حفظ الفحص بنجاح"})
    except Exception as e:
        print(f"Error adding inspection: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

# دالة لتحديث الإحصائيات
def update_analytics():
    try:
        df_vehicles = pd.read_excel(EXCEL_FILE, sheet_name='Vehicles')
        df_inspections = pd.read_excel(EXCEL_FILE, sheet_name='Inspections')
        
        total_vehicles = len(df_vehicles)
        total_inspections = len(df_inspections)
        
        passed_inspections = len(df_inspections[df_inspections['overallStatus'] == 'Passed'])
        action_required = len(df_inspections[df_inspections['overallStatus'] == 'Action Required'])
        
        inspected_vehicles = df_inspections['vehicleId'].nunique()
        not_inspected = total_vehicles - inspected_vehicles
        
        analytics_data = {
            'totalVehicles': [total_vehicles],
            'totalInspections': [total_inspections],
            'passedInspections': [passed_inspections],
            'actionRequiredInspections': [action_required],
            'totalVehiclesInspected': [inspected_vehicles],
            'totalVehiclesNotInspected': [not_inspected]
        }
        
        return pd.DataFrame(analytics_data)
    except Exception as e:
        print(f"Error updating analytics: {e}")
        return pd.DataFrame()

# 7. تحديث سيارة
@app.route('/update_vehicle/<int:vehicle_id>', methods=['PUT'])
def update_vehicle(vehicle_id):
    try:
        updated_data = request.json
        df = pd.read_excel(EXCEL_FILE, sheet_name='Vehicles')
        
        # تحديث بيانات السيارة
        for key, value in updated_data.items():
            df.loc[df['id'] == vehicle_id, key] = value
        
        # حفظ الملف
        with pd.ExcelWriter(EXCEL_FILE, engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
            df.to_excel(writer, sheet_name='Vehicles', index=False)
            
            df_inspections = pd.read_excel(EXCEL_FILE, sheet_name='Inspections')
            df_inspections.to_excel(writer, sheet_name='Inspections', index=False)
            
            try:
                df_analytics = pd.read_excel(EXCEL_FILE, sheet_name='Analytics')
                df_analytics.to_excel(writer, sheet_name='Analytics', index=False)
            except:
                pass
        
        return jsonify({"success": True, "message": "تم تحديث السيارة بنجاح"})
    except Exception as e:
        print(f"Error updating vehicle: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    print("🚀 تشغيل خادم Flask...")
    print("📊 الموقع متاح على: http://localhost:5000")
    print("⚠️  اضغط Ctrl+C للإيقاف")
    app.run(host='0.0.0.0', port=5000, debug=True)
