import { UIRefinementAgent, UIRefinementPayload } from './ui-refinement-agent';
import { promises as fs } from 'fs';

// Mock fs operations for testing
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    mkdir: jest.fn(),
    appendFile: jest.fn(),
  },
}));

interface MockDirEntry {
  name: string;
  isFile: () => boolean;
  isDirectory: () => boolean;
}

const mockFs = fs as jest.Mocked<typeof fs>;

describe('UIRefinementAgent', () => {
  let agent: UIRefinementAgent;
  const mockFiles = [
    'apps/dashboard/src/components/Button.tsx',
    'apps/dashboard/src/components/Card.tsx',
  ];

  beforeEach(() => {
    agent = new UIRefinementAgent('ui-refinement-test', 'UI Refinement Test Agent');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Agent initialization', () => {
    it('should initialize with correct properties', () => {
      expect(agent.id).toBe('ui-refinement-test');
      expect(agent.name).toBe('UI Refinement Test Agent');
      expect(agent.type).toBe('ui-refinement');
      expect(agent.capabilities).toContain('check_contrast');
      expect(agent.capabilities).toContain('fix_contrast_issues');
      expect(agent.capabilities).toContain('validate_accessibility');
    });
  });

  describe('analyzeContrast', () => {
    it('should identify contrast issues in TSX files', async () => {
      const mockFileContent = `
        <div className="bg-neutral-900 text-neutral-700">
          <p className="text-neutral-600">Low contrast text</p>
        </div>
      `;

      jest.spyOn(fs, 'readFile').mockResolvedValue(mockFileContent);

      const payload: UIRefinementPayload = {
        action: 'analyze_contrast',
        parameters: { files: mockFiles },
      };

      const result = await agent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.issues).toHaveLength(2);
      expect(result.data.issues[0].type).toBe('contrast');
    });

    it('should handle files with no contrast issues', async () => {
      const mockFileContent = `
        <div className="bg-white text-black">
          <p className="text-gray-900">Good contrast text</p>
        </div>
      `;

      jest.spyOn(fs, 'readFile').mockResolvedValue(mockFileContent);

      const payload: UIRefinementPayload = {
        action: 'analyze_contrast',
        parameters: { files: mockFiles },
      };

      const result = await agent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.issues).toHaveLength(0);
    });
  });

  describe('fixContrastIssues', () => {
    it('should fix contrast issues in files', async () => {
      const mockFileContent = `
        <div className="bg-neutral-900 text-neutral-700">
          <p className="text-neutral-600">Low contrast text</p>
        </div>
      `;

      jest.spyOn(fs, 'readFile').mockResolvedValue(mockFileContent);
      jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const payload: UIRefinementPayload = {
        action: 'fix_contrast',
        parameters: { files: mockFiles },
      };

      const result = await agent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.fixedIssues.length).toBeGreaterThan(0);
    });

    it('should handle files with no fixable issues', async () => {
      const mockFileContent = `
        <div className="bg-white text-black">
          <p className="text-gray-900">Good contrast text</p>
        </div>
      `;

      jest.spyOn(fs, 'readFile').mockResolvedValue(mockFileContent);

      const payload: UIRefinementPayload = {
        action: 'fix_contrast',
        parameters: { files: mockFiles },
      };

      const result = await agent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.fixedIssues).toHaveLength(0);
    });
  });

  describe('analyzeSpacing', () => {
    it('should identify spacing inconsistencies', async () => {
      const mockFileContent = `
        <div className="p-1 m-2">
          <div className="px-3 py-1">Inconsistent spacing</div>
        </div>
      `;

      jest.spyOn(fs, 'readFile').mockResolvedValue(mockFileContent);

      const payload: UIRefinementPayload = {
        action: 'analyze_spacing',
        parameters: { files: mockFiles },
      };

      const result = await agent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.issues.length).toBeGreaterThan(0);
    });

    it('should handle files with consistent spacing', async () => {
      const mockFileContent = `
        <div className="p-4 m-4">
          <div className="px-4 py-4">Consistent spacing</div>
        </div>
      `;

      jest.spyOn(fs, 'readFile').mockResolvedValue(mockFileContent);

      const payload: UIRefinementPayload = {
        action: 'analyze_spacing',
        parameters: { files: mockFiles },
      };

      const result = await agent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.issues).toHaveLength(0);
    });
  });

  describe('analyzeAccessibility', () => {
    it('should identify accessibility issues', async () => {
      const mockFileContent = `
        <button className="bg-blue-500">Click me</button>
        <img src="test.jpg" />
      `;

      jest.spyOn(fs, 'readFile').mockResolvedValue(mockFileContent);

      const payload: UIRefinementPayload = {
        action: 'analyze_accessibility',
        parameters: { files: mockFiles },
      };

      const result = await agent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Theme consistency', () => {
    it('should fix theme inconsistencies', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: 'test.tsx', isFile: () => true, isDirectory: () => false } as any,
      ]);

      mockFs.readFile.mockResolvedValue(`
        <div className="bg-gray-900 text-gray-300">
          <p>Content</p>
        </div>
      `);

      const result = await agent.execute({
        task: 'fix_theme_consistency',
        context: { targetDir: 'test' },
        priority: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.data.fixedIssues.length).toBeGreaterThan(0);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('Responsive layout checking', () => {
    it('should detect responsive issues', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: 'test.tsx', isFile: () => true, isDirectory: () => false } as any,
      ]);

      mockFs.readFile.mockResolvedValue(`
        <div className="w-[500px] overflow-hidden">
          <p>Fixed width content</p>
        </div>
      `);

      const result = await agent.execute({
        task: 'check_responsive_layout',
        context: { targetDir: 'test' },
        priority: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.data.issues.length).toBeGreaterThan(0);
      expect(result.data.issues.some((issue: any) => issue.type === 'responsive')).toBe(true);
    });
  });

  describe('UI pattern auditing', () => {
    it('should detect UI pattern inconsistencies', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: 'test.tsx', isFile: () => true, isDirectory: () => false } as any,
      ]);

      mockFs.readFile.mockResolvedValue(`
        <div className="bg-white rounded-lg p-4">
          <button className="bg-blue-500">Click</button>
        </div>
      `);

      const result = await agent.execute({
        task: 'audit_ui_patterns',
        context: { targetDir: 'test' },
        priority: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.data.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Auto-fix all issues', () => {
    it('should run all checks and fixes comprehensively', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: 'test.tsx', isFile: () => true, isDirectory: () => false } as any,
      ]);

      mockFs.readFile.mockResolvedValue(`
        <div className="bg-neutral-900 text-neutral-700 bg-gray-800">
          <img src="image.jpg" />
          <button>Click</button>
          <div className="w-[500px] overflow-hidden">Content</div>
        </div>
      `);

      const result = await agent.execute({
        task: 'auto_fix_ui_issues',
        context: { targetDir: 'test' },
        priority: 'medium',
      });

      expect(result.success).toBe(true);
      expect(result.data.issues.length).toBeGreaterThan(0);
      expect(result.data.fixedIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should handle unknown tasks', async () => {
      const result = await agent.execute({
        task: 'unknown_task',
        context: {},
        priority: 'medium',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown task');
    });

    it('should handle file system errors gracefully', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));

      const result = await agent.execute({
        task: 'check_contrast',
        context: { targetDir: 'nonexistent' },
        priority: 'medium',
      });

      expect(result.success).toBe(true); // Should still succeed with empty results
      expect(result.data.issues).toHaveLength(0);
    });
  });
});
