// Shared custom styles for react-select to maintain consistency across the application
export const customSelectStyles = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    minHeight: '44px',
    borderRadius: '0.75rem',
    borderColor: state.isFocused ? '#0f172a' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '&:hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#e2e8f0'
    },
    cursor: 'pointer',
    backgroundColor: 'white',
    transition: 'all 0.2s'
  }),
  valueContainer: (base: Record<string, unknown>) => ({
    ...base,
    padding: '0 1rem',
    fontWeight: '500',
    fontSize: '0.875rem'
  }),
  singleValue: (base: Record<string, unknown>) => ({
    ...base,
    color: '#0f172a'
  }),
  menu: (base: Record<string, unknown>) => ({
    ...base,
    borderRadius: '0.75rem',
    marginTop: '0.25rem',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden'
  }),
  menuList: (base: Record<string, unknown>) => ({
    ...base,
    padding: '0.25rem',
    borderRadius: '0.75rem'
  }),
  option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected ? '#0f172a' : state.isFocused ? '#f1f5f9' : 'white',
    color: state.isSelected ? 'white' : '#0f172a',
    cursor: 'pointer',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    fontWeight: state.isSelected ? '500' : '400',
    transition: 'all 0.15s',
    '&:active': {
      backgroundColor: state.isSelected ? '#0f172a' : '#e2e8f0'
    }
  }),
  indicatorSeparator: () => ({
    display: 'none'
  }),
  dropdownIndicator: (base: Record<string, unknown>) => ({
    ...base,
    color: '#64748b',
    '&:hover': {
      color: '#0f172a'
    }
  })
};
