import os

def create_file(path):
    """Create an empty file at the specified path if it doesn't exist."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'a'):
        pass

def create_project_structure():
    """Create the folder and file structure for the src directory."""
    # Root directory
    root_dir = "src"
    os.makedirs(root_dir, exist_ok=True)

    # app directory
    app_files = [
        "app/(auth)/login/page.tsx",
        "app/(auth)/register/page.tsx",
        "app/(auth)/layout.tsx",
        "app/(dashboard)/browse/page.tsx",
        "app/(dashboard)/search/page.tsx",
        "app/(dashboard)/watch/[id]/page.tsx",
        "app/(dashboard)/my-list/page.tsx",
        "app/(dashboard)/profile/page.tsx",
        "app/(dashboard)/layout.tsx",
        "app/admin/dashboard/page.tsx",
        "app/admin/content/page.tsx",
        "app/admin/content/add/page.tsx",
        "app/admin/content/[id]/page.tsx",
        "app/admin/content/[id]/edit/page.tsx",
        "app/admin/users/page.tsx",
        "app/admin/users/[id]/page.tsx",
        "app/admin/analytics/page.tsx",
        "app/admin/subscriptions/page.tsx",
        "app/admin/layout.tsx",
        "app/api/auth/[...nextauth]/route.ts",
        "app/globals.css",
        "app/layout.tsx",
        "app/loading.tsx",
        "app/error.tsx",
        "app/not-found.tsx",
        "app/page.tsx"
    ]
    for file in app_files:
        create_file(os.path.join(root_dir, file))

    # components directory
    component_files = [
        "components/ui/",
        "components/auth/LoginForm.tsx",
        "components/auth/RegisterForm.tsx",
        "components/auth/ProtectedRoute.tsx",
        "components/content/ContentCard.tsx",
        "components/content/ContentGrid.tsx",
        "components/content/ContentDetails.tsx",
        "components/content/VideoPlayer.tsx",
        "components/content/ContentCarousel.tsx",
        "components/content/GenreFilter.tsx",
        "components/admin/AdminSidebar.tsx",
        "components/admin/AdminHeader.tsx",
        "components/admin/ContentForm.tsx",
        "components/admin/UserTable.tsx",
        "components/admin/AnalyticsCharts.tsx",
        "components/admin/DashboardStats.tsx",
        "components/layout/Header.tsx",
        "components/layout/Footer.tsx",
        "components/layout/Sidebar.tsx",
        "components/layout/LoadingSpinner.tsx",
        "components/common/SearchBar.tsx",
        "components/common/Pagination.tsx",
        "components/common/Modal.tsx",
        "components/common/Toast.tsx"
    ]
    for file in component_files:
        if file.endswith("/"):
            os.makedirs(os.path.join(root_dir, file), exist_ok=True)
        else:
            create_file(os.path.join(root_dir, file))

    # lib directory
    lib_files = [
        "lib/auth.ts",
        "lib/api.ts",
        "lib/utils.ts",
        "lib/validations.ts",
        "lib/constants.ts",
        "lib/types.ts"
    ]
    for file in lib_files:
        create_file(os.path.join(root_dir, file))

    # hooks directory
    hook_files = [
        "hooks/useAuth.ts",
        "hooks/useContent.ts",
        "hooks/useAdmin.ts",
        "hooks/useLocalStorage.ts",
        "hooks/useDebounce.ts"
    ]
    for file in hook_files:
        create_file(os.path.join(root_dir, file))

    # store directory
    store_files = [
        "store/authStore.ts",
        "store/contentStore.ts",
        "store/adminStore.ts"
    ]
    for file in store_files:
        create_file(os.path.join(root_dir, file))

    # styles directory
    style_files = [
        "styles/globals.css"
    ]
    for file in style_files:
        create_file(os.path.join(root_dir, file))

if __name__ == "__main__":
    create_project_structure()
    print("Src project structure created successfully.")