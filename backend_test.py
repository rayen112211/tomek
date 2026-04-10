import requests
import sys
import json
import io
from datetime import datetime

class LeadQualificationEngineAPITester:
    def __init__(self, base_url="https://lead-vault-9.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_lead_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_seed_data(self):
        """Test seeding data"""
        success, response = self.run_test("Seed Data", "POST", "admin/seed", 200)
        if success:
            print(f"   Seeded {response.get('count', 0)} leads")
        return success, response

    def test_force_seed_data(self):
        """Test force seeding data"""
        success, response = self.run_test("Force Seed Data", "POST", "admin/seed/force", 200)
        if success:
            print(f"   Force seeded {response.get('count', 0)} leads")
        return success, response

    def test_get_leads(self):
        """Test getting leads list"""
        success, response = self.run_test("Get Leads", "GET", "leads", 200)
        if success:
            leads = response.get('leads', [])
            total = response.get('total', 0)
            print(f"   Found {len(leads)} leads (total: {total})")
            if leads:
                self.test_lead_id = leads[0]['id']
                print(f"   Sample lead ID: {self.test_lead_id}")
        return success, response

    def test_get_lead_stats(self):
        """Test getting lead statistics"""
        success, response = self.run_test("Get Lead Stats", "GET", "leads/stats", 200)
        if success:
            stats = response
            print(f"   Total: {stats.get('total', 0)}")
            print(f"   ICP Fit: {stats.get('fit', 0)}")
            print(f"   Partial Fit: {stats.get('partial_fit', 0)}")
            print(f"   Not Fit: {stats.get('not_fit', 0)}")
            print(f"   Avg Score: {stats.get('avg_score', 0)}")
            print(f"   Missing Emails: {stats.get('missing_emails', 0)}")
        return success, response

    def test_search_leads(self):
        """Test searching leads"""
        search_params = {"search": "tech", "page": 1, "page_size": 10}
        success, response = self.run_test("Search Leads", "GET", "leads", 200, params=search_params)
        if success:
            leads = response.get('leads', [])
            print(f"   Search results: {len(leads)} leads")
        return success, response

    def test_filter_leads(self):
        """Test filtering leads by ICP fit"""
        filter_params = {"icp_fit": "Fit", "min_score": 5}
        success, response = self.run_test("Filter Leads", "GET", "leads", 200, params=filter_params)
        if success:
            leads = response.get('leads', [])
            print(f"   Filtered results: {len(leads)} leads")
        return success, response

    def test_get_single_lead(self):
        """Test getting a single lead"""
        if not self.test_lead_id:
            print("❌ No test lead ID available")
            return False, {}
        
        success, response = self.run_test("Get Single Lead", "GET", f"leads/{self.test_lead_id}", 200)
        if success:
            print(f"   Lead: {response.get('company_name', 'Unknown')}")
            print(f"   Score: {response.get('score', 0)}")
            print(f"   ICP Fit: {response.get('icp_fit', 'Unknown')}")
        return success, response

    def test_update_lead(self):
        """Test updating a lead"""
        if not self.test_lead_id:
            print("❌ No test lead ID available")
            return False, {}
        
        update_data = {
            "notes": f"Updated by test at {datetime.now().isoformat()}",
            "company_name": "Test Company Updated"
        }
        success, response = self.run_test("Update Lead", "PATCH", f"leads/{self.test_lead_id}", 200, data=update_data)
        if success:
            print(f"   Updated lead: {response.get('company_name', 'Unknown')}")
            print(f"   Notes: {response.get('notes', '')[:50]}...")
        return success, response

    def test_get_icp_settings(self):
        """Test getting ICP settings"""
        success, response = self.run_test("Get ICP Settings", "GET", "settings/icp", 200)
        if success:
            settings = response
            print(f"   Target countries: {len(settings.get('target_countries', []))}")
            print(f"   Target industries: {len(settings.get('target_industries', []))}")
            print(f"   Min employees: {settings.get('target_employee_min', 0)}")
            print(f"   Max employees: {settings.get('target_employee_max', 0)}")
            print(f"   Min score: {settings.get('minimum_acceptable_score', 0)}")
        return success, response

    def test_update_icp_settings(self):
        """Test updating ICP settings"""
        # First get current settings
        success, current_settings = self.test_get_icp_settings()
        if not success:
            return False, {}
        
        # Update minimum score
        updated_settings = current_settings.copy()
        updated_settings['minimum_acceptable_score'] = 6
        
        success, response = self.run_test("Update ICP Settings", "PUT", "settings/icp", 200, data=updated_settings)
        if success:
            print(f"   Updated min score to: {response.get('minimum_acceptable_score', 0)}")
        return success, response

    def test_recalculate_leads(self):
        """Test recalculating all leads"""
        success, response = self.run_test("Recalculate Leads", "POST", "leads/recalculate", 200)
        if success:
            print(f"   Recalculated {response.get('count', 0)} leads")
        return success, response

    def test_mock_enrich_email(self):
        """Test mock email enrichment"""
        if not self.test_lead_id:
            print("❌ No test lead ID available")
            return False, {}
        
        success, response = self.run_test("Mock Enrich Email", "POST", f"enrich/email/{self.test_lead_id}", 200)
        if success:
            print(f"   Message: {response.get('message', '')}")
            print(f"   Email: {response.get('email', '')}")
            print(f"   Status: {response.get('status', '')}")
        return success, response

    def test_mock_verify_email(self):
        """Test mock email verification"""
        if not self.test_lead_id:
            print("❌ No test lead ID available")
            return False, {}
        
        success, response = self.run_test("Mock Verify Email", "POST", f"verify/email/{self.test_lead_id}", 200)
        if success:
            print(f"   Message: {response.get('message', '')}")
            print(f"   Email: {response.get('email', '')}")
            print(f"   Status: {response.get('status', '')}")
        return success, response

    def test_csv_preview(self):
        """Test CSV preview functionality"""
        # Create a simple test CSV
        csv_content = """Company Name,Website,Country,Industry,Employee Range,Decision Maker Name,Decision Maker Role,Email
Test Corp,https://testcorp.com,United States,Technology,51-200,John Doe,CEO,john@testcorp.com
Sample Inc,https://sample.com,United Kingdom,Financial Services,201-500,Jane Smith,CFO,jane@sample.com"""
        
        csv_file = io.StringIO(csv_content)
        files = {'file': ('test.csv', csv_file.getvalue(), 'text/csv')}
        
        success, response = self.run_test("CSV Preview", "POST", "leads/import/preview", 200, files=files)
        if success:
            print(f"   Columns detected: {len(response.get('columns', []))}")
            print(f"   Sample rows: {len(response.get('sample_rows', []))}")
            print(f"   Total rows: {response.get('total_rows', 0)}")
            print(f"   Suggested mappings: {len(response.get('suggested_mappings', []))}")
        return success, response

    def test_export_leads(self):
        """Test exporting leads"""
        success, response = self.run_test("Export Leads", "POST", "leads/export", 200)
        # For export, we expect a file download, so we'll check if we get a response
        if success:
            print("   Export successful (file download)")
        return success, response

    def test_bulk_delete_leads(self):
        """Test bulk delete leads"""
        # First create a test lead to delete
        test_lead_data = {
            "company_name": "Delete Test Company",
            "country": "Test Country",
            "industry": "Test Industry",
            "source": "API Test"
        }
        
        # We'll skip this test since we don't have a create endpoint
        # and don't want to delete real leads
        print("🔍 Testing Bulk Delete Leads...")
        print("   ⚠️  Skipped - Would delete real leads")
        return True, {}

def main():
    print("🚀 Starting Lead Qualification Engine API Tests")
    print("=" * 60)
    
    tester = LeadQualificationEngineAPITester()
    
    # Test sequence
    tests = [
        tester.test_root_endpoint,
        tester.test_force_seed_data,  # Force seed to ensure we have data
        tester.test_get_leads,
        tester.test_get_lead_stats,
        tester.test_search_leads,
        tester.test_filter_leads,
        tester.test_get_single_lead,
        tester.test_update_lead,
        tester.test_get_icp_settings,
        tester.test_update_icp_settings,
        tester.test_recalculate_leads,
        tester.test_mock_enrich_email,
        tester.test_mock_verify_email,
        tester.test_csv_preview,
        tester.test_export_leads,
        tester.test_bulk_delete_leads,
    ]
    
    print(f"\n📋 Running {len(tests)} API tests...\n")
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All API tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())