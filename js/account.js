// JavaScript cho phần tài khoản và đổi mật khẩu

document.addEventListener('DOMContentLoaded', function() {
    // Các phần tử DOM
    const accountSection = document.getElementById('account-section');
    const passwordSection = document.getElementById('password-section');
    const closeAccountBtn = document.getElementById('close-account');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const backToAccountBtn = document.getElementById('back-to-account');
    const logoutBtn = document.getElementById('logout-btn');
    const submitPasswordBtn = document.getElementById('submit-password');
    const cancelPasswordBtn = document.getElementById('cancel-password');
    const passwordMessage = document.getElementById('password-message');
    
    // Các trường input
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    // Hiển thị thông tin tài khoản từ localStorage hoặc API
    function updateAccountInfo() {
        const currentUser = Auth.getCurrentUser();
        
        if (currentUser) {
            document.getElementById('account-name').textContent = currentUser.name || 'Người dùng';
            document.getElementById('account-email').textContent = currentUser.email || '';
            
            // Format ngày tạo
            if (currentUser.createdAt) {
                const createdDate = new Date(currentUser.createdAt);
                document.getElementById('account-created').textContent = 
                    createdDate.toLocaleDateString('vi-VN');
            }
        }
    }
    
    // Mở phần tài khoản
    function openAccountSection() {
        // Cập nhật thông tin tài khoản
        updateAccountInfo();
        
        // Hiển thị phần tài khoản
        accountSection.style.display = 'flex';
        passwordSection.style.display = 'none';
        
        // Animation hiển thị
        setTimeout(() => {
            accountSection.style.opacity = '1';
        }, 10);
    }
    
    // Đóng phần tài khoản
    function closeAccountSection() {
        accountSection.style.opacity = '0';
        
        setTimeout(() => {
            accountSection.style.display = 'none';
        }, 300);
    }
    
    // Mở form đổi mật khẩu
    function openPasswordSection() {
        // Reset form
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        passwordMessage.textContent = '';
        passwordMessage.className = 'password-message';
        
        // Ẩn tài khoản, hiển thị đổi mật khẩu
        accountSection.style.display = 'none';
        passwordSection.style.display = 'flex';
        
        // Animation hiển thị
        setTimeout(() => {
            passwordSection.style.opacity = '1';
        }, 10);
        
        // Focus vào ô mật khẩu hiện tại
        currentPasswordInput.focus();
    }
    
    // Đóng form đổi mật khẩu
    function closePasswordSection() {
        passwordSection.style.opacity = '0';
        
        setTimeout(() => {
            passwordSection.style.display = 'none';
        }, 300);
    }
    
    // Quay lại phần tài khoản
    function backToAccount() {
        closePasswordSection();
        openAccountSection();
    }
    
    // Xác thực form đổi mật khẩu
    function validatePasswordForm() {
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Kiểm tra trống
        if (!currentPassword || !newPassword || !confirmPassword) {
            showPasswordError('Vui lòng điền đầy đủ thông tin');
            return false;
        }
        
        // Kiểm tra độ dài mật khẩu mới
        if (newPassword.length < 6) {
            showPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return false;
        }
        
        // Kiểm tra mật khẩu xác nhận
        if (newPassword !== confirmPassword) {
            showPasswordError('Mật khẩu xác nhận không khớp');
            return false;
        }
        
        return true;
    }
    
    // Hiển thị lỗi
    function showPasswordError(message) {
        passwordMessage.textContent = message;
        passwordMessage.className = 'password-message error';
    }
    
    // Hiển thị thành công
    function showPasswordSuccess(message) {
        passwordMessage.textContent = message;
        passwordMessage.className = 'password-message success';
    }
    
    // Xử lý đổi mật khẩu
    async function handleChangePassword() {
        // Xác thực form
        if (!validatePasswordForm()) {
            return;
        }
        
        // Lấy giá trị
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        
        try {
            // Hiển thị trạng thái đang xử lý
            submitPasswordBtn.disabled = true;
            submitPasswordBtn.textContent = 'Đang xử lý...';
            
            // Gọi API đổi mật khẩu
            const result = await Auth.changePassword(currentPassword, newPassword);
            
            // Xử lý kết quả
            if (result.success) {
                showPasswordSuccess('Đổi mật khẩu thành công');
                
                // Sau 2 giây, quay lại trang tài khoản
                setTimeout(() => {
                    backToAccount();
                }, 2000);
            } else {
                showPasswordError(result.error || 'Đổi mật khẩu thất bại');
            }
        } catch (error) {
            showPasswordError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
            console.error('Change password error:', error);
        } finally {
            // Khôi phục nút
            submitPasswordBtn.disabled = false;
            submitPasswordBtn.textContent = 'Cập nhật';
        }
    }
    
    // Xử lý đăng xuất
    async function handleLogout() {
        try {
            await Auth.logout();
            // Đóng phần tài khoản
            closeAccountSection();
            // Auth state change event sẽ xử lý phần còn lại
        } catch (error) {
            console.error('Logout error:', error);
            alert('Đăng xuất thất bại. Vui lòng thử lại.');
        }
    }
    
    // Đăng ký sự kiện
    if (closeAccountBtn) closeAccountBtn.addEventListener('click', closeAccountSection);
    if (changePasswordBtn) changePasswordBtn.addEventListener('click', openPasswordSection);
    if (backToAccountBtn) backToAccountBtn.addEventListener('click', backToAccount);
    if (cancelPasswordBtn) cancelPasswordBtn.addEventListener('click', backToAccount);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (submitPasswordBtn) submitPasswordBtn.addEventListener('click', handleChangePassword);
    
    // Thêm vào đối tượng UI nếu cần
    if (window.UI) {
        window.UI.openAccountSection = openAccountSection;
        window.UI.closeAccountSection = closeAccountSection;
    }
});