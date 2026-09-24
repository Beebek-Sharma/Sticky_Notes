const createMock = () => {
  const inst = {
    get: jest.fn(() => Promise.resolve({ data: [] })),
    post: jest.fn((url, data) => Promise.resolve({ data: { id: 1, ...data } })),
    put: jest.fn((url, data) => Promise.resolve({ data: { id: 1, ...data } })),
    patch: jest.fn((url, data) => Promise.resolve({ data: { id: 1, ...data } })),
    delete: jest.fn(() => Promise.resolve({ status: 204 })),
  };
  inst.create = jest.fn(() => inst);
  inst.default = inst;
  return inst;
};

const mockAxios = createMock();

module.exports = mockAxios;
module.exports.default = mockAxios;
