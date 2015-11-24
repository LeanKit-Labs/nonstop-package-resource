## 0.2.*

### 0.2.0
 * Change to fs-extra vs mv, cp and rimraf
 * Update to latest nonstop-pack
 * Support S3 for package storage
 * Support RethinkDB for package information storage

## 0.1.0

### 0.1.16
 * Improve package search to allow version + build to be provided in version

### 0.1.14
 * Bug fix - include topic in event payload being published

### 0.1.13
 * Bug fix - correct improper use of `name` property to `file`
 * Bug fix - pass packageList argument correctly when promoting

### 0.1.12
 * Include corrected nonstop-pack version
 * Bug fix - use newer promote functionality in nonstop-pack

### 0.1.11
Add missing package promotion.

### 0.1.10
 * Add support for new package format to includ commit slugs
 * Add event channel to support web hooks in the index

### 0.1.9

Bug fix - fix error message on file transfer error.

### 0.1.8
Update resource to work with latest Autohost action syntax.

### 0.1.7
Add missing lib to package.json

### 0.1.6
Bug fixes for upload handle and getLatest behaviors.

### 0.1.5
Fix weird API. Add URL prefix and use hyped to render responses.

### 0.1.3
Add parameter metadata to improve hypermedia available when used with hyped.

### 0.1.1
Bug fix - correct require in resource referncing old and invalid project name.
