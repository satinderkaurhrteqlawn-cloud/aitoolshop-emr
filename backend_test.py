#!/usr/bin/env python3
"""
Backend API Testing Suite for Digital Products & OTT Subscription Store
Tests all backend APIs including auth, products, orders, and admin endpoints.
"""

import asyncio
import aiohttp
import json
import os
import uuid
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://stream-suite-3.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class APITester:
    def __init__(self):
        self.session = None
        self.admin_token = None
        self.customer_token = None
        self.test_results = {
            "auth": {},
            "products": {},
            "orders": {},
            "admin": {},
            "errors": []
        }

    async def setup_session(self):
        """Setup aiohttp session"""
        connector = aiohttp.TCPConnector(ssl=False)
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=aiohttp.ClientTimeout(total=30),
            headers={"Content-Type": "application/json"}
        )

    async def cleanup(self):
        """Cleanup session"""
        if self.session:
            await self.session.close()

    async def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None, expected_status: int = 200) -> Dict:
        """Make HTTP request with proper error handling"""
        url = f"{API_BASE}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            async with self.session.request(method, url, json=data, headers=headers) as response:
                response_data = await response.json()
                
                result = {
                    "status": response.status,
                    "data": response_data,
                    "success": response.status == expected_status,
                    "url": url,
                    "method": method
                }
                
                if not result["success"]:
                    print(f"❌ {method} {endpoint} - Expected {expected_status}, got {response.status}")
                    print(f"   Response: {response_data}")
                else:
                    print(f"✅ {method} {endpoint} - Status {response.status}")
                
                return result
                
        except Exception as e:
            error_result = {
                "status": 0,
                "data": {"error": str(e)},
                "success": False,
                "url": url,
                "method": method
            }
            print(f"❌ {method} {endpoint} - Exception: {str(e)}")
            return error_result

    async def test_health_check(self):
        """Test health endpoint"""
        print("\n🔍 Testing Health Check...")
        result = await self.make_request("GET", "health")
        self.test_results["auth"]["health"] = result
        return result["success"]

    async def test_user_registration(self):
        """Test user registration API"""
        print("\n🔍 Testing User Registration...")
        
        # Test 1: Valid registration
        test_user_data = {
            "name": "John Doe",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "password": "password123"
        }
        
        result = await self.make_request("POST", "auth/register", test_user_data, expected_status=200)
        self.test_results["auth"]["register_valid"] = result
        
        if result["success"] and "token" in result["data"]:
            self.customer_token = result["data"]["token"]
            print(f"   ✅ Customer token obtained")
        
        # Test 2: Duplicate email
        duplicate_result = await self.make_request("POST", "auth/register", test_user_data, expected_status=400)
        self.test_results["auth"]["register_duplicate"] = duplicate_result
        
        # Test 3: Missing fields
        invalid_data = {"email": "test@example.com"}
        missing_result = await self.make_request("POST", "auth/register", invalid_data, expected_status=400)
        self.test_results["auth"]["register_missing_fields"] = missing_result
        
        # Test 4: Admin user registration
        admin_data = {
            "name": "Admin User",
            "email": "parwal111@gmail.com",
            "password": "admin123"
        }
        admin_result = await self.make_request("POST", "auth/register", admin_data, expected_status=200)
        self.test_results["auth"]["register_admin"] = admin_result
        
        return all([result["success"], duplicate_result["success"], missing_result["success"]])

    async def test_user_login(self):
        """Test user login API"""
        print("\n🔍 Testing User Login...")
        
        # Test 1: Valid admin login
        admin_login_data = {
            "email": "parwal111@gmail.com",
            "password": "admin123"
        }
        
        admin_result = await self.make_request("POST", "auth/login", admin_login_data, expected_status=200)
        self.test_results["auth"]["login_admin"] = admin_result
        
        if admin_result["success"] and "token" in admin_result["data"]:
            self.admin_token = admin_result["data"]["token"]
            print(f"   ✅ Admin token obtained")
        
        # Test 2: Invalid credentials
        invalid_login = {
            "email": "wrong@example.com",
            "password": "wrongpassword"
        }
        invalid_result = await self.make_request("POST", "auth/login", invalid_login, expected_status=401)
        self.test_results["auth"]["login_invalid"] = invalid_result
        
        # Test 3: Missing fields
        missing_fields = {"email": "test@example.com"}
        missing_result = await self.make_request("POST", "auth/login", missing_fields, expected_status=400)
        self.test_results["auth"]["login_missing_fields"] = missing_result
        
        return all([admin_result["success"], invalid_result["success"], missing_result["success"]])

    async def test_forgot_password(self):
        """Test forgot password flow"""
        print("\n🔍 Testing Forgot Password...")
        
        # Test 1: Valid email
        forgot_data = {"email": "parwal111@gmail.com"}
        result = await self.make_request("POST", "auth/forgot-password", forgot_data, expected_status=200)
        self.test_results["auth"]["forgot_password_valid"] = result
        
        demo_otp = None
        if result["success"] and "demo_otp" in result["data"]:
            demo_otp = result["data"]["demo_otp"]
            print(f"   ✅ Demo OTP received: {demo_otp}")
        
        # Test 2: Invalid email
        invalid_email = {"email": "nonexistent@example.com"}
        invalid_result = await self.make_request("POST", "auth/forgot-password", invalid_email, expected_status=404)
        self.test_results["auth"]["forgot_password_invalid"] = invalid_result
        
        # Test password reset if OTP was received
        if demo_otp:
            reset_data = {
                "email": "parwal111@gmail.com",
                "otp": demo_otp,
                "newPassword": "newpassword123"
            }
            reset_result = await self.make_request("POST", "auth/reset-password", reset_data, expected_status=200)
            self.test_results["auth"]["reset_password_valid"] = reset_result
            
            # Test with invalid OTP
            invalid_otp_data = {
                "email": "parwal111@gmail.com",
                "otp": "000000",
                "newPassword": "anotherpassword"
            }
            invalid_otp_result = await self.make_request("POST", "auth/reset-password", invalid_otp_data, expected_status=400)
            self.test_results["auth"]["reset_password_invalid_otp"] = invalid_otp_result
            
            return all([result["success"], invalid_result["success"], reset_result["success"], invalid_otp_result["success"]])
        
        return all([result["success"], invalid_result["success"]])

    async def test_products_apis(self):
        """Test products APIs"""
        print("\n🔍 Testing Products APIs...")
        
        # Test 1: Get all products
        all_products_result = await self.make_request("GET", "products", expected_status=200)
        self.test_results["products"]["get_all"] = all_products_result
        
        product_id = None
        if all_products_result["success"] and all_products_result["data"]:
            product_id = all_products_result["data"][0]["id"]
            print(f"   ✅ Found {len(all_products_result['data'])} products")
        
        # Test 2: Get products with filters
        filtered_result = await self.make_request("GET", "products?category=OTT&status=instock", expected_status=200)
        self.test_results["products"]["get_filtered"] = filtered_result
        
        search_result = await self.make_request("GET", "products?search=Netflix", expected_status=200)
        self.test_results["products"]["get_search"] = search_result
        
        # Test 3: Get single product
        if product_id:
            single_product_result = await self.make_request("GET", f"products/{product_id}", expected_status=200)
            self.test_results["products"]["get_single"] = single_product_result
        
        # Test 4: Get non-existent product
        nonexistent_result = await self.make_request("GET", "products/nonexistent", expected_status=404)
        self.test_results["products"]["get_nonexistent"] = nonexistent_result
        
        success_tests = [all_products_result["success"], filtered_result["success"], search_result["success"], nonexistent_result["success"]]
        if product_id:
            success_tests.append(single_product_result["success"])
        
        return all(success_tests)

    async def test_orders_apis(self):
        """Test orders APIs (requires authentication)"""
        print("\n🔍 Testing Orders APIs...")
        
        if not self.customer_token:
            print("   ❌ No customer token available, skipping customer order tests")
            return False
        
        # Test 1: Create order
        order_data = {
            "productId": "test-product-id",
            "productName": "Netflix Premium",
            "duration": 1,
            "amount": 199,
            "paymentMethod": "whatsapp"
        }
        
        create_order_result = await self.make_request("POST", "orders", order_data, token=self.customer_token, expected_status=200)
        self.test_results["orders"]["create"] = create_order_result
        
        # Test 2: Get user orders
        get_orders_result = await self.make_request("GET", "orders", token=self.customer_token, expected_status=200)
        self.test_results["orders"]["get_user_orders"] = get_orders_result
        
        # Test 3: Create order without auth
        no_auth_result = await self.make_request("POST", "orders", order_data, expected_status=401)
        self.test_results["orders"]["create_no_auth"] = no_auth_result
        
        # Test 4: Get orders without auth
        get_no_auth_result = await self.make_request("GET", "orders", expected_status=401)
        self.test_results["orders"]["get_no_auth"] = get_no_auth_result
        
        return all([create_order_result["success"], get_orders_result["success"], no_auth_result["success"], get_no_auth_result["success"]])

    async def test_admin_apis(self):
        """Test admin APIs (requires admin authentication)"""
        print("\n🔍 Testing Admin APIs...")
        
        if not self.admin_token:
            print("   ❌ No admin token available, skipping admin tests")
            return False
        
        # Test 1: Get all orders (admin)
        admin_orders_result = await self.make_request("GET", "admin/orders", token=self.admin_token, expected_status=200)
        self.test_results["admin"]["get_orders"] = admin_orders_result
        
        # Test 2: Get all users (admin)
        admin_users_result = await self.make_request("GET", "admin/users", token=self.admin_token, expected_status=200)
        self.test_results["admin"]["get_users"] = admin_users_result
        
        # Test 3: Get dashboard stats
        admin_stats_result = await self.make_request("GET", "admin/stats", token=self.admin_token, expected_status=200)
        self.test_results["admin"]["get_stats"] = admin_stats_result
        
        # Test 4: Create product (admin)
        new_product_data = {
            "name": "Test Product",
            "description": "Test product description",
            "category": "Software",
            "image": "https://example.com/image.png",
            "features": ["Feature 1", "Feature 2"],
            "pricing": {"1": 100, "3": 250, "6": 450, "12": 800},
            "status": "active"
        }
        
        create_product_result = await self.make_request("POST", "admin/products", new_product_data, token=self.admin_token, expected_status=200)
        self.test_results["admin"]["create_product"] = create_product_result
        
        created_product_id = None
        if create_product_result["success"] and "id" in create_product_result["data"]:
            created_product_id = create_product_result["data"]["id"]
            print(f"   ✅ Created product with ID: {created_product_id}")
        
        # Test 5: Update product (admin)
        if created_product_id:
            update_data = {
                "name": "Updated Test Product",
                "status": "out_of_stock"
            }
            update_product_result = await self.make_request("PUT", f"admin/products/{created_product_id}", update_data, token=self.admin_token, expected_status=200)
            self.test_results["admin"]["update_product"] = update_product_result
            
            # Test 6: Delete product (admin)
            delete_product_result = await self.make_request("DELETE", f"admin/products/{created_product_id}", token=self.admin_token, expected_status=200)
            self.test_results["admin"]["delete_product"] = delete_product_result
        
        # Test 7: Admin endpoints without auth
        no_auth_orders_result = await self.make_request("GET", "admin/orders", expected_status=401)
        self.test_results["admin"]["orders_no_auth"] = no_auth_orders_result
        
        # Test 8: Admin endpoints with customer token
        if self.customer_token:
            customer_admin_result = await self.make_request("GET", "admin/users", token=self.customer_token, expected_status=401)
            self.test_results["admin"]["customer_access_admin"] = customer_admin_result
        
        success_tests = [
            admin_orders_result["success"],
            admin_users_result["success"],
            admin_stats_result["success"],
            create_product_result["success"],
            no_auth_orders_result["success"]
        ]
        
        if created_product_id:
            success_tests.extend([update_product_result["success"], delete_product_result["success"]])
        
        if self.customer_token:
            success_tests.append(customer_admin_result["success"])
        
        return all(success_tests)

    async def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Backend API Tests for Digital Products & OTT Store...")
        print(f"🌐 Base URL: {API_BASE}")
        
        await self.setup_session()
        
        try:
            # Run tests in sequence
            health_ok = await self.test_health_check()
            registration_ok = await self.test_user_registration()
            login_ok = await self.test_user_login()
            forgot_password_ok = await self.test_forgot_password()
            products_ok = await self.test_products_apis()
            orders_ok = await self.test_orders_apis()
            admin_ok = await self.test_admin_apis()
            
            # Print summary
            print("\n" + "="*60)
            print("📊 BACKEND API TEST SUMMARY")
            print("="*60)
            
            test_categories = [
                ("Health Check", health_ok),
                ("User Registration", registration_ok),
                ("User Login", login_ok),
                ("Forgot Password", forgot_password_ok),
                ("Products APIs", products_ok),
                ("Orders APIs", orders_ok),
                ("Admin APIs", admin_ok)
            ]
            
            all_passed = True
            for category, passed in test_categories:
                status = "✅ PASS" if passed else "❌ FAIL"
                print(f"{category:20} : {status}")
                if not passed:
                    all_passed = False
            
            print("="*60)
            overall_status = "✅ ALL TESTS PASSED" if all_passed else "❌ SOME TESTS FAILED"
            print(f"OVERALL STATUS: {overall_status}")
            print("="*60)
            
            # Print token info
            if self.admin_token:
                print(f"🔑 Admin Token: {self.admin_token[:20]}...")
            if self.customer_token:
                print(f"🔑 Customer Token: {self.customer_token[:20]}...")
            
            return all_passed, self.test_results
            
        finally:
            await self.cleanup()

async def main():
    """Main test runner"""
    tester = APITester()
    success, results = await tester.run_all_tests()
    
    # Save detailed results to file
    with open("/app/backend_test_results.json", "w") as f:
        json.dump({
            "success": success,
            "timestamp": "2025-01-27",
            "results": results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    return success

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)