import { Router } from "express";
import { db } from "./db";
import { 
  softwareClassifications, 
  softwareProjects, 
  softwareRequirements,
  softwareArchitecture,
  softwareRiskAnalysis,
  softwareConfigurationItems,
  softwareProblems,
  softwareTestPlans,
  softwareTestCases,
  softwareTestExecutions,
  insertSoftwareProjectSchema,
  insertSoftwareRequirementSchema,
  insertSoftwareArchitectureSchema,
  insertSoftwareRiskAnalysisSchema,
  insertSoftwareConfigurationItemSchema,
  insertSoftwareProblemSchema,
  insertSoftwareTestPlanSchema,
  insertSoftwareTestCaseSchema,
  insertSoftwareTestExecutionSchema,
  users
} from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Generate automatic project code for software projects
async function generateSoftwareProjectCode(): Promise<string> {
  const currentYear = new Date().getFullYear();
  
  // Find the highest existing software project number for this year
  const existingProjects = await db
    .select()
    .from(softwareProjects);
  
  let maxNumber = 0;
  existingProjects.forEach(project => {
    const match = project.projectId?.match(/SW-\d{4}-(\d{3})/);
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  });
  
  const nextNumber = maxNumber + 1;
  return `SW-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
}

// Initialize Software Classifications (IEC 62304 Classes A, B, C)
router.post("/initialize-classifications", async (req, res) => {
  try {
    const classifications = [
      {
        name: "Class A",
        description: "Non-life-threatening software - Software that is not intended to harm the patient or operator",
        requirements: JSON.stringify([
          "Software development planning",
          "Software requirements analysis", 
          "Software architectural design",
          "Software integration and integration testing",
          "Software system testing",
          "Software release"
        ]),
        riskLevel: "Non-safety",
        processRequirements: JSON.stringify([
          "Planning process",
          "Requirements analysis process",
          "Architectural design process", 
          "Integration and testing process",
          "System testing process",
          "Release process"
        ]),
        documentationRequirements: JSON.stringify([
          "Software development plan",
          "Software requirements specification",
          "Software architecture specification",
          "Integration test plan and results",
          "System test plan and results",
          "Release documentation"
        ])
      },
      {
        name: "Class B", 
        description: "Non-life-threatening software - Software that could harm the patient or operator but harm is not life-threatening",
        requirements: JSON.stringify([
          "Software development planning",
          "Software requirements analysis",
          "Software architectural design", 
          "Software detailed design",
          "Software implementation",
          "Software integration and integration testing",
          "Software system testing",
          "Software release",
          "Software configuration management",
          "Software problem resolution"
        ]),
        riskLevel: "Non-life-threatening",
        processRequirements: JSON.stringify([
          "Planning process with risk management",
          "Requirements analysis process",
          "Architectural design process",
          "Detailed design process",
          "Implementation process with coding standards",
          "Integration and testing process",
          "System testing process",
          "Release process",
          "Configuration management process",
          "Problem resolution process"
        ]),
        documentationRequirements: JSON.stringify([
          "Software development plan",
          "Software requirements specification", 
          "Software architecture specification",
          "Software detailed design specification",
          "Implementation documentation",
          "Integration test plan and results",
          "System test plan and results",
          "Configuration management plan",
          "Problem resolution procedures",
          "Release documentation"
        ])
      },
      {
        name: "Class C",
        description: "Life-threatening software - Software that could result in death or serious injury to the patient or operator",
        requirements: JSON.stringify([
          "Software development planning",
          "Software requirements analysis",
          "Software architectural design",
          "Software detailed design", 
          "Software implementation",
          "Software integration and integration testing",
          "Software system testing",
          "Software release",
          "Software configuration management",
          "Software problem resolution",
          "Software risk management",
          "Software maintenance"
        ]),
        riskLevel: "Life-threatening",
        processRequirements: JSON.stringify([
          "Comprehensive planning process with risk management",
          "Detailed requirements analysis process",
          "Rigorous architectural design process",
          "Detailed design process with safety considerations",
          "Implementation process with strict coding standards",
          "Comprehensive integration and testing process",
          "Extensive system testing process",
          "Controlled release process",
          "Strict configuration management process",
          "Formal problem resolution process",
          "Continuous risk management process",
          "Ongoing maintenance process"
        ]),
        documentationRequirements: JSON.stringify([
          "Comprehensive software development plan",
          "Detailed software requirements specification",
          "Software architecture specification with safety analysis",
          "Detailed software design specification",
          "Implementation documentation with traceability",
          "Comprehensive integration test plan and results",
          "Extensive system test plan and results",
          "Configuration management plan and procedures",
          "Problem resolution procedures and records",
          "Risk management file",
          "Maintenance procedures",
          "Release documentation with safety assessment"
        ])
      }
    ];

    // Insert classifications if they don't exist
    for (const classification of classifications) {
      await db.insert(softwareClassifications)
        .values(classification)
        .onConflictDoNothing();
    }

    res.json({ message: "Software classifications initialized successfully" });
  } catch (error) {
    console.error("Error initializing software classifications:", error);
    res.status(500).json({ error: "Failed to initialize software classifications" });
  }
});

// Get all software classifications
router.get("/classifications", async (req, res) => {
  try {
    const classifications = await db.select().from(softwareClassifications).orderBy(asc(softwareClassifications.name));
    res.json(classifications);
  } catch (error) {
    console.error("Error fetching software classifications:", error);
    res.status(500).json({ error: "Failed to fetch software classifications" });
  }
});

// Create new software project with automatic project code generation
router.post("/projects", async (req, res) => {
  try {
    // Generate automatic project code
    const projectCode = await generateSoftwareProjectCode();
    
    // Validate request body
    const validatedData = insertSoftwareProjectSchema.parse(req.body);
    
    // Insert software project with auto-generated code
    const [project] = await db.insert(softwareProjects)
      .values({
        ...validatedData,
        projectId: projectCode,
        status: 'planning'
      })
      .returning();

    res.json({ 
      project,
      projectId: projectCode,
      message: `Software project created with code: ${projectCode}`
    });
  } catch (error) {
    console.error("Error creating software project:", error);
    res.status(500).json({ error: "Failed to create software project" });
  }
});

// Software Projects CRUD
router.get("/projects", async (req, res) => {
  try {
    const projects = await db
      .select({
        id: softwareProjects.id,
        projectId: softwareProjects.projectId,
        name: softwareProjects.name,
        description: softwareProjects.description,
        classification: softwareClassifications.name,
        classificationRiskLevel: softwareClassifications.riskLevel,
        productFamily: softwareProjects.productFamily,
        softwareType: softwareProjects.softwareType,
        version: softwareProjects.version,
        status: softwareProjects.status,
        projectManager: users.firstName,
        projectManagerLastName: users.lastName,
        createdAt: softwareProjects.createdAt
      })
      .from(softwareProjects)
      .leftJoin(softwareClassifications, eq(softwareProjects.classificationId, softwareClassifications.id))
      .leftJoin(users, eq(softwareProjects.projectManager, users.id))
      .orderBy(desc(softwareProjects.createdAt));

    res.json(projects);
  } catch (error) {
    console.error("Error fetching software projects:", error);
    res.status(500).json({ error: "Failed to fetch software projects" });
  }
});

router.get("/projects/:id", async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const [project] = await db
      .select()
      .from(softwareProjects)
      .where(eq(softwareProjects.id, projectId));

    if (!project) {
      return res.status(404).json({ error: "Software project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Error fetching software project:", error);
    res.status(500).json({ error: "Failed to fetch software project" });
  }
});

router.post("/projects", async (req, res) => {
  try {
    const projectData = insertSoftwareProjectSchema.parse(req.body);
    
    // Generate unique project ID with SW prefix for software projects
    const currentYear = new Date().getFullYear();
    const projectCount = await db.select().from(softwareProjects);
    const projectId = `SW-${currentYear}-${String(projectCount.length + 1).padStart(3, '0')}`;
    
    const [newProject] = await db
      .insert(softwareProjects)
      .values({
        ...projectData,
        projectId,
        status: 'planning' // Set default status
      })
      .returning();

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating software project:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid project data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create software project" });
  }
});

// Software Requirements CRUD
router.get("/projects/:projectId/requirements", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const requirements = await db
      .select()
      .from(softwareRequirements)
      .where(eq(softwareRequirements.projectId, projectId))
      .orderBy(asc(softwareRequirements.requirementId));

    res.json(requirements);
  } catch (error) {
    console.error("Error fetching software requirements:", error);
    res.status(500).json({ error: "Failed to fetch software requirements" });
  }
});

router.post("/projects/:projectId/requirements", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const requirementData = insertSoftwareRequirementSchema.parse({
      ...req.body,
      projectId
    });
    
    // Generate unique requirement ID
    const requirementCount = await db
      .select()
      .from(softwareRequirements)
      .where(eq(softwareRequirements.projectId, projectId)) as any[];
    
    const requirementId = `REQ-${projectId}-${String(requirementCount.length + 1).padStart(3, '0')}`;
    
    const [newRequirement] = await db
      .insert(softwareRequirements)
      .values({
        ...requirementData,
        requirementId,
      })
      .returning();

    res.status(201).json(newRequirement);
  } catch (error) {
    console.error("Error creating software requirement:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid requirement data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create software requirement" });
  }
});

// Software Risk Analysis CRUD
router.get("/projects/:projectId/risk-analysis", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const riskAnalysis = await db
      .select()
      .from(softwareRiskAnalysis)
      .where(eq(softwareRiskAnalysis.projectId, projectId))
      .orderBy(desc(softwareRiskAnalysis.riskScore));

    res.json(riskAnalysis);
  } catch (error) {
    console.error("Error fetching software risk analysis:", error);
    res.status(500).json({ error: "Failed to fetch software risk analysis" });
  }
});

router.post("/projects/:projectId/risk-analysis", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const riskData = insertSoftwareRiskAnalysisSchema.parse({
      ...req.body,
      projectId
    });
    
    // Generate unique risk ID
    const riskCount = await db
      .select()
      .from(softwareRiskAnalysis)
      .where(eq(softwareRiskAnalysis.projectId, projectId));
    
    const riskId = `RISK-${projectId}-${String(riskCount.length + 1).padStart(3, '0')}`;
    
    // Calculate risk score (P x S x D)
    const riskScore = riskData.probabilityOfOccurrence * riskData.severityOfHarm * riskData.probabilityOfDetection;
    
    // Determine risk level based on score
    let riskLevel = "Acceptable";
    if (riskScore >= 100) {
      riskLevel = "Unacceptable";
    } else if (riskScore >= 50) {
      riskLevel = "As Low As Reasonably Practicable";
    }
    
    const [newRisk] = await db
      .insert(softwareRiskAnalysis)
      .values({
        ...riskData,
        riskId,
        riskScore,
        riskLevel,
      })
      .returning();

    res.status(201).json(newRisk);
  } catch (error) {
    console.error("Error creating software risk analysis:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid risk data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create software risk analysis" });
  }
});

// Software Configuration Items CRUD
router.get("/projects/:projectId/configuration-items", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const configItems = await db
      .select()
      .from(softwareConfigurationItems)
      .where(eq(softwareConfigurationItems.projectId, projectId))
      .orderBy(asc(softwareConfigurationItems.name));

    res.json(configItems);
  } catch (error) {
    console.error("Error fetching configuration items:", error);
    res.status(500).json({ error: "Failed to fetch configuration items" });
  }
});

router.post("/projects/:projectId/configuration-items", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const configData = insertSoftwareConfigurationItemSchema.parse({
      ...req.body,
      projectId
    });
    
    // Generate unique item ID
    const itemCount = await db
      .select()
      .from(softwareConfigurationItems)
      .where(eq(softwareConfigurationItems.projectId, projectId));
    
    const itemId = `CI-${projectId}-${String(itemCount.length + 1).padStart(3, '0')}`;
    
    const [newConfigItem] = await db
      .insert(softwareConfigurationItems)
      .values({
        ...configData,
        itemId,
      })
      .returning();

    res.status(201).json(newConfigItem);
  } catch (error) {
    console.error("Error creating configuration item:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid configuration item data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create configuration item" });
  }
});

// Software Problems CRUD
router.get("/projects/:projectId/problems", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const problems = await db
      .select({
        id: softwareProblems.id,
        problemId: softwareProblems.problemId,
        title: softwareProblems.title,
        problemType: softwareProblems.problemType,
        severity: softwareProblems.severity,
        priority: softwareProblems.priority,
        status: softwareProblems.status,
        safetyImpact: softwareProblems.safetyImpact,
        securityImpact: softwareProblems.securityImpact,
        reportedBy: users.firstName,
        reportedByLastName: users.lastName,
        reportedAt: softwareProblems.reportedAt
      })
      .from(softwareProblems)
      .leftJoin(users, eq(softwareProblems.reportedBy, users.id))
      .where(eq(softwareProblems.projectId, projectId))
      .orderBy(desc(softwareProblems.reportedAt));

    res.json(problems);
  } catch (error) {
    console.error("Error fetching software problems:", error);
    res.status(500).json({ error: "Failed to fetch software problems" });
  }
});

router.post("/projects/:projectId/problems", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const problemData = insertSoftwareProblemSchema.parse({
      ...req.body,
      projectId
    });
    
    // Generate unique problem ID
    const problemCount = await db
      .select()
      .from(softwareProblems)
      .where(eq(softwareProblems.projectId, projectId));
    
    const problemId = `PROB-${projectId}-${String(problemCount.length + 1).padStart(3, '0')}`;
    
    const [newProblem] = await db
      .insert(softwareProblems)
      .values({
        ...problemData,
        problemId,
      })
      .returning();

    res.status(201).json(newProblem);
  } catch (error) {
    console.error("Error creating software problem:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid problem data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create software problem" });
  }
});

// Software Test Plans CRUD
router.get("/projects/:projectId/test-plans", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const testPlans = await db
      .select()
      .from(softwareTestPlans)
      .where(eq(softwareTestPlans.projectId, projectId))
      .orderBy(asc(softwareTestPlans.name));

    res.json(testPlans);
  } catch (error) {
    console.error("Error fetching test plans:", error);
    res.status(500).json({ error: "Failed to fetch test plans" });
  }
});

router.post("/projects/:projectId/test-plans", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const testPlanData = insertSoftwareTestPlanSchema.parse({
      ...req.body,
      projectId
    });
    
    // Generate unique plan ID
    const planCount = await db
      .select()
      .from(softwareTestPlans)
      .where(eq(softwareTestPlans.projectId, projectId));
    
    const planId = `TP-${projectId}-${String(planCount.length + 1).padStart(3, '0')}`;
    
    const [newTestPlan] = await db
      .insert(softwareTestPlans)
      .values({
        ...testPlanData,
        planId,
      })
      .returning();

    res.status(201).json(newTestPlan);
  } catch (error) {
    console.error("Error creating test plan:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid test plan data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create test plan" });
  }
});

// Generate IEC 62304 Compliance Report
router.get("/projects/:projectId/compliance-report", async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    // Get project details
    const [project] = await db
      .select()
      .from(softwareProjects)
      .leftJoin(softwareClassifications, eq(softwareProjects.classificationId, softwareClassifications.id))
      .where(eq(softwareProjects.id, projectId));

    if (!project) {
      return res.status(404).json({ error: "Software project not found" });
    }

    // Get compliance metrics
    const requirements = await db.select().from(softwareRequirements).where(eq(softwareRequirements.projectId, projectId));
    const riskAnalysis = await db.select().from(softwareRiskAnalysis).where(eq(softwareRiskAnalysis.projectId, projectId));
    const configItems = await db.select().from(softwareConfigurationItems).where(eq(softwareConfigurationItems.projectId, projectId));
    const problems = await db.select().from(softwareProblems).where(eq(softwareProblems.projectId, projectId));
    const testPlans = await db.select().from(softwareTestPlans).where(eq(softwareTestPlans.projectId, projectId));

    // Calculate compliance metrics
    const completedRequirements = requirements.filter(req => req.status === 'verified').length;
    const openRisks = riskAnalysis.filter(risk => risk.status !== 'closed').length;
    const openProblems = problems.filter(prob => prob.status === 'open').length;
    const approvedTestPlans = testPlans.filter(plan => plan.status === 'approved').length;

    const complianceReport = {
      project: {
        name: project.software_projects.name,
        classification: project.software_classifications?.name,
        riskLevel: project.software_classifications?.riskLevel,
        version: project.software_projects.version,
        status: project.software_projects.status
      },
      metrics: {
        requirements: {
          total: requirements.length,
          completed: completedRequirements,
          completionRate: requirements.length > 0 ? (completedRequirements / requirements.length * 100).toFixed(1) : 0
        },
        riskAnalysis: {
          total: riskAnalysis.length,
          open: openRisks,
          highRisks: riskAnalysis.filter(risk => risk.riskLevel === 'Unacceptable').length
        },
        configurationItems: {
          total: configItems.length,
          baselined: configItems.filter(item => item.status === 'baseline').length
        },
        problems: {
          total: problems.length,
          open: openProblems,
          critical: problems.filter(prob => prob.severity === 'Critical').length
        },
        testPlans: {
          total: testPlans.length,
          approved: approvedTestPlans
        }
      },
      complianceStatus: {
        requirementsComplete: completedRequirements === requirements.length,
        risksMitigated: openRisks === 0,
        problemsResolved: openProblems === 0,
        testingComplete: approvedTestPlans === testPlans.length
      }
    };

    res.json(complianceReport);
  } catch (error) {
    console.error("Error generating compliance report:", error);
    res.status(500).json({ error: "Failed to generate compliance report" });
  }
});

export default router;