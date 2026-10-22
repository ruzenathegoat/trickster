<?php

namespace Tests\Feature;

use Tests\TestCase;
use Composer\InstalledVersions;

class SecurityPatchTest extends TestCase
{
    /**
     * Test PHP runtime satisfies patched version.
     */
    public function test_php_runtime_version(): void
    {
        $this->assertTrue(
            version_compare(PHP_VERSION, '8.3.33', '>='),
            'PHP version must be >= 8.3.33. Current version: ' . PHP_VERSION
        );
    }

    /**
     * Test critical dependencies are patched against known CVEs.
     */
    public function test_patched_dependency_versions(): void
    {
        // Laravel framework patched against CVE-2026-102279 (fixed in >= 13.30.0)
        $laravelVersion = app()->version();
        $this->assertTrue(
            version_compare($laravelVersion, '13.30.0', '>='),
            'Laravel framework must be >= 13.30.0. Current: ' . $laravelVersion
        );

        // Guzzle patched against CVE-2026-69246 & CVE-2026-69245 (fixed in >= 7.15.2)
        if (class_exists(InstalledVersions::class)) {
            $guzzleVersion = InstalledVersions::getPrettyVersion('guzzlehttp/guzzle');
            $this->assertNotNull($guzzleVersion);
            $this->assertTrue(
                version_compare($guzzleVersion, '7.15.2', '>='),
                'Guzzle must be >= 7.15.2. Current: ' . $guzzleVersion
            );

            // Commonmark patched against DoS and XSS vulnerabilities
            $commonmarkVersion = InstalledVersions::getPrettyVersion('league/commonmark');
            $this->assertNotNull($commonmarkVersion);
            $this->assertTrue(
                version_compare($commonmarkVersion, '2.10.4', '>='),
                'Commonmark must be >= 2.10.4. Current: ' . $commonmarkVersion
            );
        }
    }

    /**
     * Test health check endpoint is functional.
     */
    public function test_health_check_endpoint(): void
    {
        $response = $this->get('/up');
        $response->assertStatus(200);
    }
}
