import React, { cloneElement, memo } from 'react'
import { Box, Tab, Tabs, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import Expandable from '../Expandable'
import Preview, { PREVIEWABLE_MIME_TYPE_SUFFEXES } from './Preview'
import { useDocument } from './DocumentProvider'
import TabPanel from './TabPanel'
import Email from './Email'
import Files from './Files'
import Text from './Text'
import PDFViewer from './pdf-viewer/Dynamic'
import { createOcrUrl } from '../../backend/api'
import { reactIcons } from '../../constants/icons'

const useStyles = makeStyles(theme => ({
    printTitle: {
        margin: theme.spacing(2),
    },
    icon: {
        verticalAlign: 'bottom',
        marginRight: theme.spacing(1),
    },
    subTab: {
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
    },
}))

function SubTabs() {
    const classes = useStyles()
    const { data, digestUrl, docRawUrl, ocrData, printMode, collection, subTab, handleSubTabChange } = useDocument()

    if (!data || !collection || !ocrData) {
        return null
    }

    const hasPreview = data.content['has-pdf-preview'] || (docRawUrl && data.content['content-type'] && (
        PREVIEWABLE_MIME_TYPE_SUFFEXES.some(x => data.content['content-type'].endsWith(x))
    ))

    const tabs = [{
        name: 'Extracted from file',
        icon: reactIcons.content,
        content: <Text content={data.content.text} />,
    }]

    tabs.push(
        ...ocrData.map(({tag, text}) => ({
            tag,
            name: (tag.startsWith('translated_') ? '' : 'OCR ') + tag,
            icon: reactIcons.ocr,
            content: <Text content={text} />,
        }))
    )

    return (
        <>
            {!printMode && tabs.length > 1 && (
                <Box>
                    <Tabs
                        value={subTab}
                        onChange={handleSubTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        {tabs.map(({ icon, name }, index) => (
                            <Tab
                                key={index}
                                icon={icon}
                                label={name}
                            />
                        ))}
                    </Tabs>
                </Box>
            )}

            <Box className={classes.subTab}>
                {data.content.filetype === 'email' && (
                    <Email />
                )}

                {tabs.map(({tag}, index) => {
                    if (subTab === index && hasPreview && !tag?.startsWith('translated_')){
                        if (index !== 0 && data.content['content-type'] === 'application/pdf') {
                            return <PDFViewer key={index} url={createOcrUrl(digestUrl, tag)} />
                        } else {
                            return <Preview key={index} />
                        }
                    }
                })}

                {!!data.children?.length && (
                    <Box>
                        <Expandable
                            resizable
                            defaultOpen
                            highlight={false}
                            fullHeight={false}
                            title={
                                <>
                                    {cloneElement(reactIcons.contentFiles, { className: classes.icon })}
                                    Files
                                </>
                            }
                        >
                            <Files />
                        </Expandable>
                    </Box>
                )}

                {tabs.map(({ name, content }, index) => (
                    <Box key={index}>
                        {printMode && tabs.length > 1 && (
                            <Typography
                                variant="h5"
                                className={classes.printTitle}
                            >
                                {name}
                            </Typography>
                        )}
                        <TabPanel
                            value={subTab}
                            index={index}
                            alwaysVisible={printMode}
                        >
                            {content}
                        </TabPanel>
                    </Box>
                ))}
            </Box>
        </>
    )
}

export default memo(SubTabs)
