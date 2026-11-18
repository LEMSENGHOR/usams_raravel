<?php

namespace App\Http\Controllers\Web;
// namespace App\Http\Controllers\Web;
use App\Http\Controllers\Controller;
use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;

/**
 * Serves the Blade page shells only. It never reads the database and never touches the REST API:
 * every page loads its data from /api in the browser with the user's Bearer token.
 */
class PageController extends Controller implements HasMiddleware
{
    /** Sets the page language from the usams_locale cookie (written by the /locale/{lang} route). */
    public static function middleware(): array
    {
        return [
            function (Request $request, Closure $next) {
                app()->setLocale($request->cookie('usams_locale') === 'km' ? 'km' : 'en');

                return $next($request);
            },
        ];
    }

    /** slug => [page title, menu group, key in resources/js/modules/config/resources.js] */
    public const ADMIN_RESOURCES = [
        'faculties' => ['Faculties', 'Academic structure', 'faculties'],
        'departments' => ['Departments', 'Academic structure', 'departments'],
        'majors' => ['Majors', 'Academic structure', 'majors'],
        'academic-years' => ['Academic Years', 'Academic structure', 'academic-years'],
        'semesters' => ['Semesters', 'Academic structure', 'semesters'],
        'students' => ['Students', 'People', 'students'],
        'lecturers' => ['Lecturers', 'People', 'lecturers'],
        'users' => ['User Accounts', 'People', 'users'],
        'classes' => ['Classes', 'Teaching', 'classes'],
        'subjects' => ['Subjects', 'Teaching', 'subjects'],
        'assignments' => ['Class-Subject Assignments', 'Teaching', 'assignments'],
        'enrollments' => ['Enrollments', 'Teaching', 'enrollments'],
        'attendance/sessions' => ['Attendance Sessions', 'Attendance', 'adminSessions'],
        'attendance/records' => ['Attendance Records', 'Attendance', 'adminRecords'],
    ];

    public const LECTURER_RESOURCES = [
        'classes' => ['My Classes', 'Teaching', 'lecturerClasses'],
        'subjects' => ['My Subjects', 'Teaching', 'lecturerSubjects'],
        'attendance/history' => ['Attendance History', 'Attendance', 'lecturerHistory'],
    ];

    private function adminNav(): array
    {
        return [
            ['group' => 'Overview', 'items' => [
                ['label' => 'Dashboard', 'path' => '/admin/dashboard', 'icon' => 'speedometer2'],
            ]],
            ['group' => 'Academic structure', 'items' => [
                ['label' => 'Faculties', 'path' => '/admin/faculties', 'icon' => 'building'],
                ['label' => 'Departments', 'path' => '/admin/departments', 'icon' => 'diagram-3'],
                ['label' => 'Majors', 'path' => '/admin/majors', 'icon' => 'mortarboard'],
                ['label' => 'Academic Years', 'path' => '/admin/academic-years', 'icon' => 'calendar-range'],
                ['label' => 'Semesters', 'path' => '/admin/semesters', 'icon' => 'calendar3'],
            ]],
            ['group' => 'People', 'items' => [
                ['label' => 'Students', 'path' => '/admin/students', 'icon' => 'people'],
                ['label' => 'Lecturers', 'path' => '/admin/lecturers', 'icon' => 'person-gear'],
                ['label' => 'User Accounts', 'path' => '/admin/users', 'icon' => 'shield-check'],
            ]],
            ['group' => 'Teaching', 'items' => [
                ['label' => 'Classes', 'path' => '/admin/classes', 'icon' => 'easel'],
                ['label' => 'Subjects', 'path' => '/admin/subjects', 'icon' => 'book'],
                ['label' => 'Class-Subject Assignments', 'path' => '/admin/assignments', 'icon' => 'link-45deg'],
                ['label' => 'Enrollments', 'path' => '/admin/enrollments', 'icon' => 'clipboard-check'],
                ['label' => 'Timetables', 'path' => '/admin/timetables', 'icon' => 'clock'],
            ]],
            ['group' => 'Attendance', 'items' => [
                ['label' => 'Attendance Sessions', 'path' => '/admin/attendance/sessions', 'icon' => 'calendar-check'],
                ['label' => 'Attendance Records', 'path' => '/admin/attendance/records', 'icon' => 'card-checklist'],
                ['label' => 'Attendance Reports', 'path' => '/admin/reports', 'icon' => 'bar-chart-line'],
            ]],
        ];
    }

    private function lecturerNav(): array
    {
        return [
            ['group' => 'Teaching', 'items' => [
                ['label' => 'Dashboard', 'path' => '/lecturer/dashboard', 'icon' => 'speedometer2'],
                ['label' => 'My Classes', 'path' => '/lecturer/classes', 'icon' => 'easel'],
                ['label' => 'My Subjects', 'path' => '/lecturer/subjects', 'icon' => 'book'],
                ['label' => 'Timetable', 'path' => '/lecturer/timetable', 'icon' => 'clock'],
            ]],
            ['group' => 'Attendance', 'items' => [
                ['label' => 'Attendance Sessions', 'path' => '/lecturer/attendance/sessions', 'icon' => 'calendar-check'],
                ['label' => 'Attendance History', 'path' => '/lecturer/attendance/history', 'icon' => 'clock-history'],
                ['label' => 'Attendance Reports', 'path' => '/lecturer/reports', 'icon' => 'bar-chart-line'],
            ]],
            ['group' => 'Account', 'items' => [
                ['label' => 'My Profile', 'path' => '/lecturer/profile', 'icon' => 'person'],
            ]],
        ];
    }

    /** Shared data every signed-in page needs (sidebar, breadcrumbs, page title). */
    private function render(string $area, string $view, array $meta): View
    {
        return view($view, array_merge([
            'area' => $area,
            'nav' => $area === 'admin' ? $this->adminNav() : $this->lecturerNav(),
            'homePath' => '/'.$area.'/dashboard',
            'homeLabel' => $area === 'admin' ? 'Admin' : 'Lecturer',
            'subtitle' => $area === 'admin' ? 'Administration' : 'Lecturer portal',
            'resource' => null,
        ], $meta));
    }

    // ---- public pages -------------------------------------------------------------------------

    public function login(): View
    {
        return view('auth.login', ['area' => 'guest', 'page' => 'login', 'title' => 'Sign in']);
    }

    public function forbidden(): View
    {
        return view('auth.forbidden', ['area' => 'any', 'page' => 'forbidden', 'title' => 'Access denied']);
    }

    // ---- admin ---------------------------------------------------------------------------------

    public function adminDashboard(): View
    {
        return $this->render('admin', 'admin.dashboard', ['page' => 'dashboard-admin', 'title' => 'Dashboard', 'group' => 'Overview']);
    }

    public function adminResource(string $slug): View
    {
        abort_unless(isset(self::ADMIN_RESOURCES[$slug]), 404);
        [$title, $group, $resource] = self::ADMIN_RESOURCES[$slug];

        return $this->render('admin', 'admin.resource', ['page' => 'resource', 'title' => $title, 'group' => $group, 'resource' => $resource]);
    }

    public function adminTimetable(): View
    {
        return $this->render('admin', 'admin.timetable', ['page' => 'timetable', 'title' => 'Timetables', 'group' => 'Teaching']);
    }

    public function adminReports(): View
    {
        return $this->render('admin', 'admin.reports', ['page' => 'reports', 'title' => 'Attendance Reports', 'group' => 'Attendance']);
    }

    public function adminSession(string $id): View
    {
        return $this->render('admin', 'admin.session', ['page' => 'attendance-sheet', 'title' => 'Session records', 'group' => 'Attendance', 'sessionId' => $id]);
    }

    // ---- lecturer ------------------------------------------------------------------------------

    public function lecturerDashboard(): View
    {
        return $this->render('lecturer', 'lecturer.dashboard', ['page' => 'dashboard-lecturer', 'title' => 'Dashboard', 'group' => 'Teaching']);
    }

    public function lecturerResource(string $slug): View
    {
        abort_unless(isset(self::LECTURER_RESOURCES[$slug]), 404);
        [$title, $group, $resource] = self::LECTURER_RESOURCES[$slug];

        return $this->render('lecturer', 'lecturer.resource', ['page' => 'resource', 'title' => $title, 'group' => $group, 'resource' => $resource]);
    }

    public function lecturerClass(string $id): View
    {
        return $this->render('lecturer', 'lecturer.class-detail', ['page' => 'class-detail', 'title' => 'Class details', 'group' => 'Teaching', 'classId' => $id]);
    }

    public function lecturerTimetable(): View
    {
        return $this->render('lecturer', 'lecturer.timetable', ['page' => 'timetable', 'title' => 'Timetable', 'group' => 'Teaching']);
    }

    public function lecturerSessions(): View
    {
        return $this->render('lecturer', 'lecturer.sessions', ['page' => 'lecturer-sessions', 'title' => 'Attendance Sessions', 'group' => 'Attendance']);
    }

    public function lecturerSession(string $id): View
    {
        return $this->render('lecturer', 'lecturer.attendance-sheet', ['page' => 'attendance-sheet', 'title' => 'Take attendance', 'group' => 'Attendance', 'sessionId' => $id]);
    }

    public function lecturerReports(): View
    {
        return $this->render('lecturer', 'lecturer.reports', ['page' => 'reports', 'title' => 'Attendance Reports', 'group' => 'Attendance']);
    }

    public function lecturerProfile(): View
    {
        return $this->render('lecturer', 'lecturer.profile', ['page' => 'profile', 'title' => 'My Profile', 'group' => 'Account']);
    }
}
