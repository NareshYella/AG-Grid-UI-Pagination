import { useState, useMemo, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import './App.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Total users to simulate (Random User API doesn't provide total count)
const TOTAL_USERS = 10000;

function App() {
  // Data state
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Calculate pagination values
  const totalRows = TOTAL_USERS;
  const totalPages = Math.ceil(totalRows / pageSize);
  const startRow = (currentPage - 1) * pageSize;
  const endRow = Math.min(startRow + pageSize, totalRows);

  // Fetch users from Random User API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://randomuser.me/api/?page=${currentPage}&results=${pageSize}&seed=aggrid-demo`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();

      // Transform API data to our format
      const users = data.results.map((user, index) => ({
        id: startRow + index + 1,
        picture: user.picture.thumbnail,
        firstName: user.name.first,
        lastName: user.name.last,
        email: user.email,
        age: user.dob.age,
        gender: user.gender.charAt(0).toUpperCase() + user.gender.slice(1),
        country: user.location.country,
        city: user.location.city,
        phone: user.phone
      }));

      setRowData(users);
    } catch (err) {
      setError(err.message);
      setRowData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, startRow]);

  // Fetch data when page or pageSize changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Column definitions
  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'picture',
      headerName: '',
      width: 60,
      cellRenderer: (params) => {
        return `<img src="${params.value}" alt="avatar" style="width: 30px; height: 30px; border-radius: 50%;" />`;
      }
    },
    { field: 'firstName', headerName: 'First Name', filter: true },
    { field: 'lastName', headerName: 'Last Name', filter: true },
    { field: 'email', headerName: 'Email', width: 220, filter: true },
    { field: 'age', headerName: 'Age', width: 80 },
    { field: 'gender', headerName: 'Gender', width: 100 },
    { field: 'country', headerName: 'Country', filter: true },
    { field: 'city', headerName: 'City', filter: true },
    { field: 'phone', headerName: 'Phone', width: 150 }
  ], []);

  // Default column definition
  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 80,
    sortable: true,
    resizable: true
  }), []);

  // Pagination handlers
  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const handlePageSizeChange = useCallback((e) => {
    const newPageSize = Number(e.target.value);
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  const handlePageInputChange = useCallback((e) => {
    const value = e.target.value;
    if (value === '') return;
    const pageNum = Math.min(Math.max(1, Number(value)), totalPages);
    setCurrentPage(pageNum);
  }, [totalPages]);

  // Export to CSV function - exports current grid content
  const exportToCSV = useCallback(() => {
    if (rowData.length === 0) {
      alert('No data to export');
      return;
    }

    const exportColumns = columnDefs.filter(col => col.field !== 'picture');
    const headers = exportColumns.map(col => col.headerName).join(',');
    const rows = rowData.map(row =>
      exportColumns.map(col => {
        const value = row[col.field];
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users-page-${currentPage}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [rowData, columnDefs, currentPage]);

  return (
    <div className="App">
      <h1>AG Grid with Custom Pagination</h1>
      <p className="subtitle">Using Random User API (randomuser.me)</p>

      <div className="grid-container">
        {/* Custom Pagination Controls */}
        <div className="pagination-container">
          <div className="pagination-left">
            <div className="pagination-controls">
              <div className="page-size-selector">
                <label htmlFor="pageSize">Rows per page:</label>
                <select id="pageSize" value={pageSize} onChange={handlePageSizeChange} disabled={loading}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="pagination-buttons">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1 || loading}
                  title="First Page"
                >
                  &#171;
                </button>
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1 || loading}
                  title="Previous Page"
                >
                  &#8249;
                </button>

                <div className="page-input-container">
                  <span>Page</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={handlePageInputChange}
                    className="page-input"
                    disabled={loading}
                  />
                  <span>of {totalPages}</span>
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages || loading}
                  title="Next Page"
                >
                  &#8250;
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages || loading}
                  title="Last Page"
                >
                  &#187;
                </button>
              </div>
            </div>

            <div className="pagination-info">
              <span>
                Showing <strong>{startRow + 1}</strong> to <strong>{endRow}</strong> of <strong>{totalRows}</strong> entries
              </span>
            </div>
          </div>

          <div className="pagination-right">
            <button className="export-btn" onClick={exportToCSV} disabled={loading}>
              Export to CSV
            </button>
          </div>
        </div>

        <div style={{ height: 500, width: '100%', position: 'relative' }}>
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
            </div>
          )}
          {error && (
            <div className="error-message">
              Error: {error}
              <button onClick={fetchUsers} className="retry-btn">Retry</button>
            </div>
          )}
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows={true}
            rowSelection="multiple"
            rowHeight={45}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
