File Manager Application Documentation

This application can receive and execute the following commands via a Server.

Commands:

Create File (createFile)
Creates a file with the specified name and writes content to it.
Parameters:
filename: (string) The name of the file to be created.
content: (string) The content to be written to the file.
Example JSON Command
json
{
"action": "createFile",
"filename": "my_new_file.txt",
"content": "This is my new file."
}

Delete File (deleteFile)

Deletes the specified named file.
Parameters:

filename: (string) The name of the file to be deleted.
Example JSON Command:


{
"action": "deleteFile",
"filename": "old_file.log"
}

Read File (readFile)

Reads the content of the specified named file and sends it back to the server.
Parameters:

filename: (string) The name of the file to be read.
Example JSON Command:
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.

{
"action": "readFile",
"filename": "important_notes.txt"
}

List Directory Contents (listDirectory)

Lists all files and folders in the directory managed by the client.
Parameters: (None)
Example JSON Command:

{
"action": "listDirectory"
}
