const express = require('express');
const router = express.Router();
const Project = require('../models/Project'); // Import the Project model
const Folder = require('../models/Folder'); // Import the Folder model
const SavedTable = require('../models/SavedTable');
const authenticateToken = require('../middleware/auth');
const cookieParser = require('cookie-parser');
router.use(cookieParser());



//  WORKSPACE
router.post('/add-workspace', authenticateToken, async (req, res) => {
  const { workspaceName } = req.body;


  console.log('Incoming request to create workspace:');
  console.log('Workspace Name:', workspaceName);
  console.log('Decoded Token:', req.user);

  // Validate request
  if (!workspaceName) {
    console.log('Workspace name is missing in the request');
    return res.status(400).json({ message: 'Please provide a workspace name' });
  }

  try {
    // Get userId from the authenticated token
    const userId = req.user.id; // assuming 'id' is the field in the decoded token
    console.log('User ID from token:', userId);

    // Check if the userId exists
    if (!userId) {
      console.log('User ID is not present in the token');
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    // Create and save the new workspace with userId
    const newProject = new Project({
      workspaceName,
      userId, // Add the userId from the token
    });

    console.log('Creating new workspace for user ID:', userId);

    await newProject.save();
    console.log('Workspace created successfully:', newProject);

    res.status(201).json(newProject); // Send back the newly created workspace
  } catch (error) {
    console.error('Error saving workspace:', error);
    res.status(500).json({ message: 'Error adding workspace' });
  }
});


//get workspace
router.get('/get-workspaces', authenticateToken, async (req, res) => {
  try {
    // Find workspaces where the userId matches the logged-in user's ID
    const workspaces = await Project.find({ userId: req.user.id });
    
    // If no workspaces are found, return an empty array or a message
    if (!workspaces.length) {
      return res.status(200).json({ message: 'No workspaces found for this user' });
    }

    res.json(workspaces); // Send back the user's workspaces
  } catch (err) {
    console.error('Error fetching workspaces:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/delete-workspace/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Find the workspace by ID
    const workspace = await Project.findById(id);
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Find all folders associated with this workspace
    const foldersToDelete = await Folder.find({ workspace: id });
    
    // Delete each folder but keep the files intact
    for (const folder of foldersToDelete) {
      await Folder.findByIdAndDelete(folder._id);
    }

    // Now delete the workspace itself
    await Project.findByIdAndDelete(id);

    // Respond with success message after workspace and folders are deleted
    res.json({ message: 'Workspace and nested folders deleted successfully, but files remain intact' });

  } catch (err) {
    console.error('Error deleting workspace and folders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to rename a workspace
router.put('/rename-workspace/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { newName } = req.body;

  // Validate newName
  if (!newName) {
    return res.status(400).json({ message: 'Please provide a new name' });
  }

  try {
    const updatedWorkspace = await Project.findByIdAndUpdate(
      id,
      { workspaceName: newName },
      { new: true } // Return the updated document
    );

    if (!updatedWorkspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    res.json(updatedWorkspace); // Send back the updated workspace
  } catch (err) {
    console.error('Error renaming workspace:', err);
    res.status(500).json({ message: 'Server error' });
  }
});




//  WORKSPACE/FOLDER
router.post('/:workspaceName/add-folder', authenticateToken, async (req, res) => {
  const { workspaceName } = req.params;
  const { folderName } = req.body;

  // Log incoming request data
  console.log('Incoming request to create folder:');
  console.log('Workspace Name:', workspaceName);
  console.log('Folder Name:', folderName);

  // Validate folder name
  if (!folderName) {
    console.log('Folder name is missing in the request');
    return res.status(400).json({ message: 'Folder name is required' });
  }

  try {
    // Find the workspace
    console.log('Searching for workspace:', workspaceName);
    const workspace = await Project.findOne({ workspaceName, userId: req.user.id }); // Ensure the workspace belongs to the user

    if (!workspace) {
      console.log(`Workspace not found: ${workspaceName}`);
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Create the folder
    console.log(`Creating folder '${folderName}' in workspace '${workspaceName}'`);
    const newFolder = new Folder({
      folderName,
      workspace: workspace._id,
      parentFolder: null, // Root-level folder
      userId: req.user.id // Associate the folder with the user
    });

    await newFolder.save();

    // Log the success response
    console.log(`Folder created successfully:`, newFolder);
    res.status(201).json(newFolder);
  } catch (error) {
    console.error('Error adding folder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/:workspaceName/folders', authenticateToken, async (req, res) => {
  const { workspaceName } = req.params;

  try {
    // Find the workspace for the logged-in user
    const workspace = await Project.findOne({ workspaceName, userId: req.user.id }); // Ensure workspace belongs to user
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Find all folders in the workspace that belong to the logged-in user
    const folders = await Folder.find({ workspace: workspace._id, userId: req.user.id }); // Ensure folders belong to the user

    res.status(200).json({ folders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Rename a folder inside a workspace
router.put('/:workspaceName/rename-folder/:folderId', authenticateToken, async (req, res) => {
  const { workspaceName, folderId } = req.params;
  const { newFolderName } = req.body;

  // Log incoming request data
  console.log('Incoming request to rename folder:');
  console.log('Workspace Name:', workspaceName);
  console.log('Folder ID:', folderId);
  console.log('New Folder Name:', newFolderName);

  // Validate new folder name
  if (!newFolderName) {
    console.log('New folder name is missing in the request');
    return res.status(400).json({ message: 'New folder name is required' });
  }

  try {
    // Find the workspace
    const workspace = await Project.findOne({ workspaceName });
    if (!workspace) {
      console.log(`Workspace not found: ${workspaceName}`);
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Find the folder to rename
    const folder = await Folder.findOne({ _id: folderId, workspace: workspace._id });
    if (!folder) {
      console.log(`Folder not found: ${folderId}`);
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Rename the folder
    folder.folderName = newFolderName;
    await folder.save();

    // Log success and return response
    console.log(`Folder renamed successfully:`, folder);
    res.status(200).json({ message: 'Folder renamed successfully', folder });
  } catch (error) {
    console.error('Error renaming folder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Delete a folder inside a workspace
router.delete('/:workspaceName/delete-folder/:folderId', authenticateToken, async (req, res) => {
  const { workspaceName, folderId } = req.params;

  // Log incoming request data
  console.log('Incoming request to delete folder:');
  console.log('Workspace Name:', workspaceName);
  console.log('Folder ID:', folderId);

  try {
    // Find the workspace
    const workspace = await Project.findOne({ workspaceName });
    if (!workspace) {
      console.log(`Workspace not found: ${workspaceName}`);
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Find the folder to delete
    const folder = await Folder.findOne({ _id: folderId, workspace: workspace._id });
    if (!folder) {
      console.log(`Folder not found: ${folderId}`);
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Delete the folder
    await Folder.findByIdAndDelete(folderId);

    // Log success and return response
    console.log(`Folder deleted successfully: ${folderId}`);
    res.status(200).json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// WORKSPACE/ADD SHEET
router.post('/:workspaceName/add-sheets', authenticateToken, async (req, res) => {
  const { workspaceName } = req.params;
  const { sheets } = req.body;

  if (!sheets || sheets.length === 0) {
    return res.status(400).json({ message: 'Please provide sheets to add' });
  }

  try {
    // Ensure the userId is present from the authenticated token
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is missing from token' });
    }

    // Find the workspace and make sure it belongs to the logged-in user
    const workspace = await Project.findOne({ workspaceName, userId });
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found or does not belong to the user' });
    }

    // Store sheets in the workspace (adjust based on the array or string model)
    workspace.assignedSheet = sheets; // Assuming assignedSheet is an array
    await workspace.save();

    res.status(200).json({ message: 'Sheets added successfully' });
  } catch (error) {
    console.error('Error adding sheets to workspace:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



router.post('/api/sheets/details', authenticateToken, async (req, res) => {
  const { sheetIds } = req.body; // Assuming you send sheetIds in the body of the request

  if (!sheetIds || sheetIds.length === 0) {
    return res.status(400).json({ message: 'No sheet IDs provided' });
  }

  try {
    // Find the sheet details by their IDs
    const sheets = await Sheet.find({ _id: { $in: sheetIds } });
    
    if (!sheets || sheets.length === 0) {
      return res.status(404).json({ message: 'Sheets not found' });
    }

    res.status(200).json({ sheets });
  } catch (error) {
    console.error('Error fetching sheet details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:workspaceName/assigned-sheets', authenticateToken, async (req, res) => {
  const { workspaceName } = req.params;

  try {
    // Fetch the workspace for the current user
    const userId = req.user.id;

    // Find the workspace by name and userId
    const workspace = await Project.findOne({ workspaceName, userId });
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found or does not belong to the user' });
    }

    // Find the detailed assigned sheets (saved tables) using the assignedSheet array in the workspace
    const assignedSheets = await SavedTable.find({ _id: { $in: workspace.assignedSheet } });

    if (!assignedSheets.length) {
      return res.status(404).json({ message: 'No assigned sheets found' });
    }

    res.status(200).json({ assignedSheets });
  } catch (error) {
    console.error('Error fetching assigned sheets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to get sheets associated with a workspace
router.get('/:workspaceName/sheets', authenticateToken, async (req, res) => {
  const { workspaceName } = req.params;

  try {
    // Find the workspace for the authenticated user
    const workspace = await Project.findOne({ workspaceName, userId: req.user.id });
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found or does not belong to the user' });
    }

    // Fetch all sheets (saved tables) for the current user
    const savedTables = await SavedTable.find({ userId: req.user.id });

    if (!savedTables || savedTables.length === 0) {
      return res.status(200).json({ message: 'No saved tables found for this workspace' });
    }

    res.status(200).json(savedTables); // Send back the saved tables
  } catch (error) {
    console.error('Error fetching saved tables:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// WORKSPACE/FOLDER/ADD SHEET
router.post('/:workspaceName/:folderName/assign-sheets', authenticateToken, async (req, res) => {
  const { workspaceName, folderName } = req.params; // Get workspace and folder name from the URL
  const { sheets } = req.body; // Get the array of sheet IDs from the request body
  const userId = req.user.id; // Get the user ID from the token

  console.log('Request received to assign sheets');
  console.log('Workspace Name:', workspaceName);
  console.log('Folder Name:', folderName);
  console.log('Sheets to Assign:', sheets);
  console.log('User ID:', userId); // Log the user ID for debugging

  try {
    // Find the workspace by name
    const workspace = await Project.findOne({ workspaceName });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Find the parent folder by workspace ObjectId and folder name
    const parentFolder = await Folder.findOne({ folderName, workspace: workspace._id });

    if (!parentFolder) {
      return res.status(404).json({ message: 'Parent folder not found' });
    }

    // Update the parent folder with the assigned sheets
    parentFolder.assignedSheets.push(...sheets); // Add new sheets to the assigned sheets
    await parentFolder.save();

    res.status(200).json({ message: 'Sheets assigned successfully' });
  } catch (error) {
    console.error('Error assigning sheets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:workspaceName/:folderName/assigned-sheets', authenticateToken, async (req, res) => {
  const { workspaceName, folderName } = req.params; // Get workspace and folder name from the URL
  const userId = req.user.id; // Get the user ID from the token

  console.log('Request received to get assigned sheets');
  console.log('Workspace Name:', workspaceName);
  console.log('Folder Name:', folderName);
  console.log('User ID:', userId); // Log the user ID for debugging

  try {
    // Find the workspace by name
    const workspace = await Project.findOne({ workspaceName });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Find the parent folder by workspace ObjectId and folder name
    const parentFolder = await Folder.findOne({ folderName, workspace: workspace._id });

    if (!parentFolder) {
      return res.status(404).json({ message: 'Parent folder not found' });
    }

    // Fetch the assigned sheets based on the assigned sheet IDs
    const assignedSheets = await SavedTable.find({
      _id: { $in: parentFolder.assignedSheets },
      userId: userId // Ensure that only the sheets assigned to the logged-in user are fetched
    });

    // Return the assigned sheets from the folder
    res.status(200).json({ assignedSheets });
  } catch (error) {
    console.error('Error fetching assigned sheets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
