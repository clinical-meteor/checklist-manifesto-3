// imports/utils/DefaultProtocols.js
import { Meteor } from 'meteor/meteor';
import { TasksCollection } from '../db/TasksCollection';
import { ListsCollection } from '../db/ListsCollection';

/**
 * Collection of default protocols that can be loaded into the system
 * when no protocols exist yet
 */
export const DefaultProtocols = [
  {
    name: "Collect Blood Specimen",
    description: "Standard protocol for collecting blood specimens",
    priority: "routine",
    status: "ready",
    items: [
      "Assemble equipment for collecting blood",
      "Assemble equipment for preventing infections",
      "Fill out patient documentation",
      "Assemble materials for packaging of samples",
      "Perform hand hygiene",
      "Put on a gown",
      "Put on face protection",
      "Put on gloves (over gown cuffs)",
      "Prepare room",
      "Identify and prepare the patient",
      "Select the site, preferably at the bend of the elbow",
      "Apply a tourniquet around the arm",
      "Ask the patient to form a fist so that the veins are more prominent",
      "Disinfect the area where you will put the needle",
      "When using vacuum extraction system with holder, insert the blood collector tube into the holder",
      "Anchor the vein",
      "Perform the blood draw",
      "When blood starts to flow, ask patient to open his/her hand",
      "Once sufficient blood has been collected (minimum 5ml), release the tourniquet BEFORE withdrawing the needle",
      "Withdraw the needle gently",
      "Put needle into leak-proof and puncture resistant sharps container",
      "Stop the bleeding and clean the skin"
    ]
  },
  {
    name: "MRI Safety Checklist",
    description: "Safety checklist for MRI procedures",
    priority: "urgent",
    status: "ready",
    items: [
      "Verify patient's identity and consent",
      "Ask if patient has a cardiac pacemaker/defibrillator",
      "Ask if patient has ever had a cardiac pacemaker/defibrillator",
      "Ask if patient has ever had heart surgery",
      "Ask if patient has a neurostimulator",
      "Ask if patient has any electronic, mechanical, or magnetic implant",
      "Ask if patient has ever had surgery to their brain",
      "Ask if patient has a programmable hydrocephalus shunt",
      "Ask if patient has ever had surgery to their ears",
      "Ask if patient has ever had surgery to their eyes",
      "Ask if patient has any metal implants, plates, or clips",
      "Ask if patient has had any metal fragments in their eyes",
      "Ask if patient has had surgery in any part of their body in the past 6 weeks",
      "Ask if patient has a prosthetic limb, eye or other artificial device",
      "Ask if patient is wearing any medication patches",
      "Verify patient is not wearing any metallic objects or jewelry",
      "Check if patient has any wound dressings",
      "Verify if patient is pregnant or breastfeeding"
    ]
  },
  {
    name: "Change Bed Linens",
    description: "Protocol for changing bed linens",
    priority: "routine",
    status: "ready",
    items: [
      "Introduce self and verify patient's identity",
      "Explain procedure to patient",
      "Gather appropriate equipment",
      "Perform hand hygiene and observe infection control procedures",
      "Provide for patient privacy",
      "Place fresh linen on patient's chair or overbed table",
      "Assess and assist patient out of bed if needed",
      "Raise the bed to a comfortable working height",
      "Apply clean gloves if linens are soiled",
      "Strip the bed",
      "Apply the bottom sheet and drawsheet",
      "Move to the other side and secure the bottom linens",
      "Apply or complete the top sheet, blanket, and spread",
      "Put clean pillowcases on the pillows",
      "Ensure patient comfort and safety"
    ]
  },
  {
    name: "Incident Response Checklist",
    description: "Steps for responding to a security incident",
    priority: "urgent",
    status: "ready",
    items: [
      "Review any information collected about the security incident",
      "Secure the network perimeter",
      "Securely connect to the affected system over a trusted connection",
      "Retrieve any volatile data from the affected system",
      "Determine the integrity and appropriateness of backing up the system",
      "If appropriate, back up the system",
      "Change passwords to the affected system(s)",
      "Determine whether it is safe to continue operations",
      "Document the security incident thoroughly",
      "Apprise management of progress",
      "Notify affected customers and partners with relevant updates"
    ]
  }
];

/**
 * Function to initialize protocols in the database
 * if none exist yet
 * @param {String} userId - ID of the user who will be set as creator
 * @param {Boolean} force - If true, will insert protocols even if some already exist
 */
export async function initializeProtocols(userId = null, force = false) {
  // Don't run if not on server
  if (!Meteor.isServer) return;
  
  // Check if we need to load protocols
  const protocolCount = await TasksCollection.find({ 
    isProtocol: true, 
    public: true 
  }).countAsync();
  
  if (protocolCount > 0 && !force) {
    console.log('Default protocols not loaded: protocols already exist');
    return;
  }
  
  console.log('Loading default protocols as system templates...');
  
  // Use "system" as the creator ID rather than the current user
  // This way they don't appear in the user's own tasks
  const creatorId = 'system';
  
  try {
    for (const protocol of DefaultProtocols) {
      // First, create a list for this protocol
      const listId = await ListsCollection.insertAsync({
        resourceType: 'List',
        status: 'active',
        mode: 'working',
        title: protocol.name,
        name: protocol.name, // For backward compatibility
        description: protocol.description,
        incompleteCount: protocol.items?.length || 0,
        public: true,
        createdAt: new Date(),
        lastModified: new Date(),
        userId: creatorId,
        isDeleted: false,
        isProtocol: true, // Mark this list as a protocol template
        isSystemTemplate: true // Explicitly mark as system template
      });
      
      console.log(`Created protocol list: ${protocol.name} (${listId})`);
      
      // Create the main protocol task
      const protocolTask = {
        resourceType: 'Task',
        status: protocol.status || 'ready',
        description: protocol.name,
        priority: protocol.priority || 'routine',
        authoredOn: new Date(),
        lastModified: new Date(),
        requester: creatorId, // System is the creator, not the current user
        public: true,
        isProtocol: true,
        isTemplate: true,
        isSystemTemplate: true, // Explicitly mark as system template
        isDeleted: false,
        listId: listId // Link to the list we created
      };
      
      const protocolId = await TasksCollection.insertAsync(protocolTask);
      console.log(`Created protocol task: ${protocol.name} (${protocolId})`);
      
      // Create subtasks if items array is provided
      if (protocol.items && Array.isArray(protocol.items)) {
        for (let i = 0; i < protocol.items.length; i++) {
          const item = protocol.items[i];
          
          const subtask = {
            resourceType: 'Task',
            status: 'ready',
            description: item,
            priority: protocol.priority || 'routine',
            authoredOn: new Date(),
            lastModified: new Date(),
            requester: creatorId, // System is the creator, not the current user
            public: true,
            isDeleted: false,
            isSystemTemplate: true, // Mark as system template
            partOf: {
              reference: `Task/${protocolId}`,
              display: protocol.name
            },
            listId: listId, // Link to the list we created
            ordinal: i
          };
          
          await TasksCollection.insertAsync(subtask);
        }
        
        console.log(`Added ${protocol.items.length} items to protocol: ${protocol.name}`);
      }
    }
    
    console.log('Default protocols loaded successfully as system templates.');
  } catch (error) {
    console.error('Error loading default protocols:', error);
  }
}

// Export both the array and the function to initialize protocols
export default {
  DefaultProtocols,
  initializeProtocols
};